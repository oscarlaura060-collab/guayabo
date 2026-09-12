import { type HTMLAttributes, type TableHTMLAttributes } from "react";

/** Contenedor con scroll horizontal en móvil + la tabla. */
export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="gy-table-wrap gy-card">
      <table className={`gy-table ${className}`.trim()} {...props} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}
export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}
export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}
export function TH(props: HTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} />;
}
export function TD(props: HTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} />;
}
