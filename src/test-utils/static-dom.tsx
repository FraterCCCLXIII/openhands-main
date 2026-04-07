import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const renderStaticDocument = (node: ReactNode) =>
  new DOMParser().parseFromString(renderToStaticMarkup(node), "text/html");

export const findHeading = (document: Document, level: number, text: string) =>
  Array.from(document.querySelectorAll(`h${level}`)).find(
    (heading): heading is HTMLHeadingElement => heading.textContent?.trim() === text,
  );

export const getCodeValues = (document: Document) =>
  Array.from(document.querySelectorAll("code")).map((node) => node.textContent?.trim() ?? "");
