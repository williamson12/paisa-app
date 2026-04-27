import { useState, useEffect, useCallback, useMemo } from "react";
import {
  subscribeToUserConfig,
  subscribeToTransactions,
  saveUserConfig,
  saveTransaction,
  deleteTransaction,
  getOnboardingStatus,
} from "../services/firestore";
import { getDoc, doc, setDoc, deleteDoc, db } from "../lib/firebase";

/**
 * Manages the user's financial data by combining user config and transactions.
 * Provides a unified data object: { monthlyIncome, monthlyBudget, transactions: [] }
 */
export function useUserData(userId) {
  const [config, setConfig] = useState(null);
  const [txns, setTxns] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [txnsLoaded, setTxnsLoaded] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Migration from old appData structure to scalable users + transactions collections
  useEffect(() => {
    if (!userId) return;

    const migrateData = async () => {
      try {
        const migratedKey = `paisa_migrated_${userId}`;
        if (localStorage.getItem(migratedKey)) return;

        const oldDocRef = doc(db, "appData", userId);
        const oldDoc = await getDoc(oldDocRef);

        if (oldDoc.exists()) {
          const oldData = oldDoc.data();
          
          // Migrate config
          await saveUserConfig(userId, {
            monthlyIncome: oldData.monthlyIncome || 0,
            monthlyBudget: oldData.monthlyBudget || 0,
            onboardingComplete: true
          });

          // Migrate transactions
          if (Array.isArray(oldData.transactions)) {
            for (const txn of oldData.transactions) {
              await saveTransaction(userId, txn);
            }
          }

          // Mark migrated
          localStorage.setItem(migratedKey, "true");
          // Safely delete old data to prevent re-migration
          await deleteDoc(oldDocRef);
          console.log("Migration complete!");
        } else {
          localStorage.setItem(migratedKey, "true");
        }
      } catch (err) {
        console.error("Migration error:", err);
      }
    };

    migrateData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    getOnboardingStatus(userId)
      .then(({ onboardingComplete: complete }) => {
        if (active) setOnboardingComplete(complete);
      })
      .catch((err) => {
        console.error("getOnboardingStatus error:", err);
      })
      .finally(() => {
        if (active) setOnboardingChecked(true);
      });

    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubConfig = subscribeToUserConfig(
      userId,
      (c) => {
        setConfig(c);
        setNeedsSetup(false);
        setConfigLoaded(true);
      },
      () => {
        setConfig({ monthlyIncome: 0, monthlyBudget: 0 });
        setNeedsSetup(true);
        setConfigLoaded(true);
      }
    );

    const unsubTxns = subscribeToTransactions(
      userId,
      (t) => {
        setTxns(t);
        setTxnsLoaded(true);
      }
    );

    return () => {
      unsubConfig();
      unsubTxns();
    };
  }, [userId]);

  // Expose a unified data object to avoid breaking existing UI components
  const data = useMemo(() => {
    return {
      monthlyIncome: config?.monthlyIncome || 0,
      monthlyBudget: config?.monthlyBudget || 0,
      transactions: txns,
    };
  }, [config, txns]);

  const save = useCallback(async (newData) => {
    // If the UI passes a complete new data object, we extract transactions vs config
    // Actually, UI usually calls save() for config updates. Wait, AddPage calls save({...data, transactions: [...]})
    // HistoryPage calls save({...data, transactions: filtered})
    // To support the old `save` signature seamlessly:
    try {
      if (newData.monthlyIncome !== data.monthlyIncome || newData.monthlyBudget !== data.monthlyBudget) {
        await saveUserConfig(userId, { monthlyIncome: newData.monthlyIncome, monthlyBudget: newData.monthlyBudget });
      }
      
      // If transactions array length changed or items modified:
      // In the old architecture, they completely rewrote the array.
      // We need to compare old and new transactions to find additions/deletions.
      const oldIds = new Set(data.transactions.map(t => t.id));
      const newIds = new Set(newData.transactions.map(t => t.id));
      
      const addedOrUpdated = newData.transactions.filter(t => !oldIds.has(t.id) || JSON.stringify(t) !== JSON.stringify(data.transactions.find(ot => ot.id === t.id)));
      const deletedIds = [...oldIds].filter(id => !newIds.has(id));
      
      for (const t of addedOrUpdated) {
        await saveTransaction(userId, t);
      }
      
      for (const id of deletedIds) {
        await deleteTransaction(userId, id);
      }
      
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [userId, data]);

  const markOnboardingComplete = useCallback(async (profile) => {
    try {
      if (profile) {
        await saveUserConfig(userId, { ...profile, onboardingComplete: true });
      } else {
        await saveUserConfig(userId, { onboardingComplete: true });
      }

      setOnboardingComplete(true);
      setNeedsSetup(false);
    } catch (err) {
      console.error("markOnboardingComplete error:", err);
      throw err;
    }
  }, [userId]);

  return {
    data,
    loaded: configLoaded && txnsLoaded,
    needsSetup: onboardingComplete ? false : needsSetup,
    setNeedsSetup,
    save,
    onboardingChecked,
    markOnboardingComplete,
  };
}
