export const LoadingSkeleton = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white/5 animate-pulse rounded-xl aspect-[2/3]"></div>
      ))}
    </>
  );
};
