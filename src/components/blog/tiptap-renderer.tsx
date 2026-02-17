import type { Json } from "@/types/database.types";

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
}

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

function renderMarks(text: string, marks?: TipTapMark[]): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<React.ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>;
      case "italic":
        return <em>{acc}</em>;
      case "code":
        return (
          <code className="bg-surface-2 text-accent px-1.5 py-0.5 rounded text-sm font-mono">
            {acc}
          </code>
        );
      case "link":
        return (
          <a
            href={mark.attrs?.href as string}
            target={
              (mark.attrs?.href as string)?.startsWith("/")
                ? undefined
                : "_blank"
            }
            rel={
              (mark.attrs?.href as string)?.startsWith("/")
                ? undefined
                : "noopener noreferrer"
            }
            className="text-accent hover:underline"
          >
            {acc}
          </a>
        );
      case "underline":
        return <u>{acc}</u>;
      case "strike":
        return <s>{acc}</s>;
      default:
        return acc;
    }
  }, text);
}

function RenderNode({
  node,
  index,
}: {
  node: TipTapNode;
  index: number;
}) {
  switch (node.type) {
    case "doc":
      return (
        <div className="space-y-4">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} index={i} />
          ))}
        </div>
      );

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const children = node.content?.map((child, i) => (
        <RenderNode key={i} node={child} index={i} />
      ));
      switch (level) {
        case 1:
          return (
            <h1 className="text-3xl font-bold text-text-primary mt-8 mb-3">
              {children}
            </h1>
          );
        case 2:
          return (
            <h2 className="text-2xl font-bold text-text-primary mt-8 mb-3">
              {children}
            </h2>
          );
        case 3:
          return (
            <h3 className="text-xl font-semibold text-text-primary mt-6 mb-2">
              {children}
            </h3>
          );
        default:
          return (
            <h4 className="text-lg font-semibold text-text-primary mt-4 mb-2">
              {children}
            </h4>
          );
      }
    }

    case "paragraph":
      return (
        <p className="text-text-secondary leading-7">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} index={i} />
          ))}
        </p>
      );

    case "bulletList":
      return (
        <ul className="list-disc list-inside space-y-2 text-text-secondary pl-2">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} index={i} />
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal list-inside space-y-2 text-text-secondary pl-2">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} index={i} />
          ))}
        </ol>
      );

    case "listItem":
      return (
        <li className="leading-7">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} index={i} />
          ))}
        </li>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-4 border-accent pl-4 py-1 my-4 text-text-secondary italic">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} index={i} />
          ))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre className="bg-surface-2 border border-border rounded-lg p-4 overflow-x-auto my-4">
          <code className="text-sm font-mono text-text-primary">
            {node.content?.map((child, i) => (
              <RenderNode key={i} node={child} index={i} />
            ))}
          </code>
        </pre>
      );

    case "hardBreak":
      return <br />;

    case "image":
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.attrs?.src as string}
            alt={(node.attrs?.alt as string) ?? ""}
            className="rounded-lg max-w-full"
          />
          {node.attrs?.title && (
            <figcaption className="text-sm text-text-tertiary mt-2 text-center">
              {node.attrs.title as string}
            </figcaption>
          )}
        </figure>
      );

    case "horizontalRule":
      return <hr className="border-border my-8" />;

    case "text":
      return <>{renderMarks(node.text ?? "", node.marks)}</>;

    default:
      return null;
  }
}

export function TipTapRenderer({ content }: { content: Json | null }) {
  if (!content) return null;

  const doc = content as unknown as TipTapNode;
  if (doc.type !== "doc") return null;

  return <RenderNode node={doc} index={0} />;
}
