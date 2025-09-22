import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";

export default function ResetAuthScreen() {
  const [done, setDone] = React.useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        await SecureStore.deleteItemAsync("userToken");
      } finally {
        setDone(true);
      }
    };
    run();
  }, []);

  if (!done) {
    return null;
  }
  return <Redirect href="/(auth)/login" />;
}


