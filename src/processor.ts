export function formatTypstItems(items: any[]): string {
  if (!items || items.length === 0) return "";
  return items.map((p: any) => {
    const safePrice = parseFloat(String(p.price)) || 0;
    const safeQty = parseFloat(String(p.quantity)) || 1;
    return `(description: "${p.description}", quantity: ${safeQty}, unit: "${p.unit || 'u'}", price: ${safePrice})`;
  }).join(", ") + ",";
}

export function mapVariables(type: string, config: any, docData: any) {
  const prestataire = config.prestataire || {};
  const client = config.client || {};
  
  const r: Record<string, any> = {
    ...config,
    ...prestataire,
    ...docData,
    items: formatTypstItems(docData.items || config.items || []),
    invoice_number: docData.number || config.number || "SANS-NUMERO",
    quote_number: docData.number || config.number || "SANS-NUMERO",
    contract_reference: docData.number || config.number || "REF-CONTRAT",
    invoice_date: docData.date || config.date || "",
    quote_date: docData.date || config.date || "",
    contract_date: docData.date || config.date || "",
    due_date: docData.due || docData.validity_date || config.due || "",
  };

  Object.entries(prestataire).forEach(([k, v]) => r[`provider_${k}`] = v);
  Object.entries(client).forEach(([k, v]) => r[`client_${k}`] = v);

  return r;
}

export function injectVariables(content: string, variables: Record<string, any>): string {
  let result = content;
  const tags = content.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  
  tags.forEach((tag) => {
    const key = tag.slice(2, -2);
    if (variables[key] !== undefined) {
      result = result.replaceAll(tag, String(variables[key]));
    } else {
      const isNumeric = key.match(/rate|price|amount|estimate|qty/);
      result = result.replaceAll(tag, isNumeric ? "0.00" : "");
    }
  });
  return result;
}
