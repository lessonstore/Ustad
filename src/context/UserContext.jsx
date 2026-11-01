import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  arrayUnion,
  auth,
  db,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getIdTokenResult,
  getRedirectResult,
  increment,
  onAuthStateChanged,
  onSnapshot,
  setDoc,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateDoc,
  googleProvider,
} from "../services/firebase.js";
import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  isMonthInActiveWindow,
  isValidMonthFormat,
} from "../utils/monthUtils.js";

const UserContext = createContext(null);
const balanceMaps = ["tokens", "subscriptions", "unlockedLessons"];
const adminEmail = "sirwaqarishaq@gmail.com";

function makeDefaultProfile(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    tokens: {},
    subscriptions: {},
    unlockedLessons: {},
  };
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [rechargeTargetMonth, setRechargeTargetMonth] = useState(null);
  const profileUnsubscribeRef = useRef(null);
  const authGenerationRef = useRef(0);

  useEffect(() => {
    let active = true;
    void getRedirectResult(auth).catch((error) => {
      if (!active) return;
      console.error("Could not complete Google sign-in redirect:", error);
      setAuthError("Could not complete sign-in. Please try again.");
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      authGenerationRef.current += 1;
      const generation = authGenerationRef.current;
      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = null;
      setCurrentUser(user);
      setUserProfile(null);
      setIsAdmin(false);
      setProfileError("");
      setAuthError("");

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      void (async () => {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        let profile;
        if (!snapshot.exists()) {
          profile = makeDefaultProfile(user);
          await setDoc(userRef, profile);
        } else {
          profile = snapshot.data();
          const defaults = makeDefaultProfile(user);
          const profileUpdates = {};
          for (const field of [
            "email",
            "displayName",
            "tokens",
            "subscriptions",
            "unlockedLessons",
          ]) {
            if (
              !Object.prototype.hasOwnProperty.call(profile, field) ||
              (balanceMaps.includes(field) &&
                (!profile[field] ||
                  typeof profile[field] !== "object" ||
                  Array.isArray(profile[field]))) ||
              (field === "email" || field === "displayName") &&
                profile[field] !== defaults[field]
            ) {
              profileUpdates[field] = defaults[field];
            }
          }
          if (Object.keys(profileUpdates).length) {
            await setDoc(userRef, profileUpdates, { merge: true });
            profile = { ...profile, ...profileUpdates };
          }
        }

        const activeMonths = new Set([
          getCurrentMonthKey(),
          getPreviousMonthKey(),
        ]);
        const cleanupFields = [];
        for (const mapName of balanceMaps) {
          const monthMap = profile[mapName] ?? {};
          for (const monthKey of Object.keys(monthMap)) {
            if (!activeMonths.has(monthKey)) {
              cleanupFields.push(new FieldPath(mapName, monthKey));
              delete monthMap[monthKey];
            }
          }
          profile[mapName] = monthMap;
        }
        if (cleanupFields.length) {
          await updateDoc(
            userRef,
            ...cleanupFields.flatMap((fieldPath) => [
              fieldPath,
              deleteField(),
            ]),
          );
        }

        const tokenResult = await getIdTokenResult(user);
        if (!active || generation !== authGenerationRef.current) return;
        setUserProfile(profile);
        setIsAdmin(
          tokenResult.claims.admin === true ||
            (user.emailVerified &&
              user.email?.toLowerCase() === adminEmail),
        );
        profileUnsubscribeRef.current = onSnapshot(
          userRef,
          (profileSnapshot) => {
            if (!active || generation !== authGenerationRef.current) return;
            if (!profileSnapshot.exists()) {
              setProfileError("Your account profile could not be found.");
              return;
            }
            setUserProfile(profileSnapshot.data());
            setLoading(false);
          },
          (error) => {
            if (!active || generation !== authGenerationRef.current) return;
            console.error("Could not listen to the user profile:", error);
            setProfileError("Could not load your account balances.");
            setLoading(false);
          },
        );
      })().catch((error) => {
        if (!active || generation !== authGenerationRef.current) return;
        console.error("Could not initialize the user profile:", error);
        setProfileError("Could not initialize your account. Please try again.");
        setLoading(false);
      });
    });

    return () => {
      active = false;
      authGenerationRef.current += 1;
      profileUnsubscribeRef.current?.();
      unsubscribeAuth();
    };
  }, []);

  const signIn = useCallback(async () => {
    setAuthError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (popupError) {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error("Could not sign in with popup or redirect:", {
          popupError,
          redirectError,
        });
        setAuthError("Could not sign in. Please try again.");
        throw redirectError;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError("");
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Could not sign out:", error);
      setAuthError("Could not sign out. Please try again.");
      throw error;
    }
  }, []);

  const hasBasePlan = useCallback(
    (monthKey) => Boolean(userProfile?.subscriptions?.[monthKey]?.active),
    [userProfile],
  );

  const openRechargeModal = useCallback((monthKey) => {
    setRechargeTargetMonth(
      isMonthInActiveWindow(monthKey) ? monthKey : getCurrentMonthKey(),
    );
  }, []);

  const closeRechargeModal = useCallback(() => {
    setRechargeTargetMonth(null);
  }, []);

  const unlockLesson = useCallback(
    async (lesson) => {
      if (!currentUser) {
        return { success: false, reason: "authentication_required" };
      }
      if (!lesson?.id || !isValidMonthFormat(lesson?.month)) {
        return { success: false, reason: "invalid_lesson" };
      }
      if (!userProfile) {
        return { success: false, reason: "profile_loading" };
      }
      if (lesson.lessonNumber === 1) {
        return { success: true, reason: "preview" };
      }
      if (!isMonthInActiveWindow(lesson.month)) {
        return { success: false, reason: "archived_window_closed" };
      }

      const monthUnlocks =
        userProfile?.unlockedLessons?.[lesson.month] ?? [];
      if (monthUnlocks.includes(lesson.id)) {
        return { success: true, reason: "already_unlocked" };
      }

      const balance = Number(userProfile?.tokens?.[lesson.month] ?? 0);
      if (balance <= 0) {
        openRechargeModal(lesson.month);
        return { success: false, reason: "insufficient_tokens" };
      }

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        [`tokens.${lesson.month}`]: increment(-1),
        [`unlockedLessons.${lesson.month}`]: arrayUnion(lesson.id),
      });
      setUserProfile((profile) => ({
        ...profile,
        tokens: {
          ...profile.tokens,
          [lesson.month]: balance - 1,
        },
        unlockedLessons: {
          ...profile.unlockedLessons,
          [lesson.month]: [...monthUnlocks, lesson.id],
        },
      }));
      return { success: true, reason: "unlocked" };
    },
    [currentUser, openRechargeModal, userProfile],
  );

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      profileError,
      authError,
      isAdmin,
      signIn,
      signOut,
      hasBasePlan,
      unlockLesson,
      openRechargeModal,
      rechargeTargetMonth,
      closeRechargeModal,
    }),
    [
      currentUser,
      userProfile,
      loading,
      profileError,
      authError,
      isAdmin,
      signIn,
      signOut,
      hasBasePlan,
      unlockLesson,
      openRechargeModal,
      rechargeTargetMonth,
      closeRechargeModal,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider.");
  }
  return context;
}
