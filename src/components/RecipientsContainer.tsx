const RecipientsContainer = ({ children }: { children: React.ReactNode }) => (
  <div id="addresses-container" className="overflow-auto max-h-96">
    <div className="flex flex-col divide-y divide-neutral-900">{children}</div>
  </div>
);

export { RecipientsContainer };
