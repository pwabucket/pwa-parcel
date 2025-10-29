import { cn } from "../lib/utils";

interface BasePickerItemProps {
  id: string;
  name: string;
  icon: string;
  onSelect?: (blockchainId: string) => void;
}

const BasePickerItem = ({ id, name, icon, onSelect }: BasePickerItemProps) => {
  return (
    <button
      key={id}
      onClick={() => onSelect && onSelect(id)}
      className={cn(
        "p-4 flex items-center gap-2 hover:bg-neutral-950 transition-colors",
        "font-bold cursor-pointer"
      )}
    >
      <img
        src={icon}
        alt={`${name} Logo`}
        className="inline size-6 rounded-full"
      />
      {name}
    </button>
  );
};

const BasePickerHeading = ({ title }: { title: string }) => {
  return (
    <h2 className="font-bold text-center">
      <span className="rounded-full bg-neutral-950 px-3 py-1">{title}</span>
    </h2>
  );
};

interface BasePickerProps {
  title?: string;
  items: { id: string; name: string; icon: string }[];
  onSelect?: (blockchainId: string) => void;
}

const BasePicker = ({ title, items, onSelect }: BasePickerProps) => {
  return (
    <>
      {title && <BasePickerHeading title={title} />}
      <div className="flex flex-col divide-y divide-neutral-900">
        {items.map((item) => (
          <BasePickerItem
            key={item.id}
            id={item.id}
            name={item.name}
            icon={item.icon}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
};

BasePicker.Item = BasePickerItem;
BasePicker.Heading = BasePickerHeading;

export { BasePicker };
