/**
 * Document service — wraps RealtyAvatar /api/documents endpoint
 *
 * Backend contract:
 *   GET /api/documents?search=<address> → documents for a property
 *   POST /api/documents → upload document (agent only)
 */

import { raFetch } from "./client";

export interface Document {
  id: string;
  property_address: string;
  suburb: string;
  doc_type: string;
  file_name: string;
  file_url?: string;
  status: string;
  uploaded_by: string;
  created_at: string;
}

export async function getDocumentsForListing(address: string): Promise<Document[]> {
  try {
    const searchTerm = address.split(" ").slice(0, 3).join(" ");
    const docs = await raFetch(`/api/documents?search=${encodeURIComponent(searchTerm)}`);
    return Array.isArray(docs) ? docs : [];
  } catch {
    return [];
  }
}

export function hasDocumentType(docs: Document[], type: string): boolean {
  return docs.some(d => d.doc_type.toLowerCase().includes(type.toLowerCase()) && d.status === "Uploaded");
}

export function getAvailableDocTypes(docs: Document[]): string[] {
  return docs.filter(d => d.status === "Uploaded").map(d => d.doc_type);
}
