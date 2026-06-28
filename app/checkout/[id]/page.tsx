useEffect(() => {
    async function processSimulatedStripeHandshake() {
      // Figure out what package they clicked based on the URL bar
      const isAnnual = id === "annual-pack" || id?.includes("annual");
      const tierName = isAnnual ? "Annual Growth Pack" : "Single Project Scan";
      const creditsToAward = isAnnual ? 5 : 1;

      // 1. Update the user's permanent account balance state in browser memory
      const sessionActive = localStorage.getItem("subshield_session");
      if (sessionActive) {
        try {
          const currentSession = JSON.parse(sessionActive);
          currentSession.credits = (currentSession.credits || 0) + creditsToAward;
          currentSession.isPaid = true;
          currentSession.tier = tierName;
          localStorage.setItem("subshield_session", JSON.stringify(currentSession));
        } catch (e) {
          console.error("Error writing payment metadata to session:", e);
        }
      }

      // 2. Hold the screen for a brief second so they see the secure transaction animation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Send them to the dashboard
      // Ensure the path matches your actual dashboard file location (e.g., app/dashboard/page.tsx)
      router.push(`/dashboard?payment_success=true&credits=${creditsToAward}`);
    }

    if (id) {
      processSimulatedStripeHandshake();
    }
  }, [id, router]);