export function createLatestRequestGuard() {
  let activeKey = null;
  let latestRequestId = 0;

  return {
    activate(key) {
      activeKey = key;
    },
    begin(key) {
      if (key !== activeKey) return () => false;

      const requestId = ++latestRequestId;
      return () => key === activeKey && requestId === latestRequestId;
    },
  };
}
