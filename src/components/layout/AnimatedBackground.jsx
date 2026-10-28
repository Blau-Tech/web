const AnimatedBackground = () => {
  return (
    <div
      className="blau-backdrop blau-backdrop--animated pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="blau-backdrop__field" />
    </div>
  );
};

export default AnimatedBackground;
