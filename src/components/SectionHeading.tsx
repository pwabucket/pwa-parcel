const SectionHeading = ({ title }: { title: string }) => {
  return (
    <h4 className="font-bold text-center">
      <span className="rounded-full bg-neutral-900 px-3 py-1">{title}</span>
    </h4>
  );
};

export { SectionHeading };
