export const DOC_CONFIG = {
  prestation: { label: "Facture Prestation", prefix: "Facture_Presta" },
  maintenance: { label: "Devis Maintenance", prefix: "Devis_Maint" },
  contrat_prestation: { label: "Contrat Prestation", prefix: "Contrat_Presta" },
  contrat_maintenance: { label: "Contrat Maintenance", prefix: "Contrat_Maint" },
} as const;

export type DocType = keyof typeof DOC_CONFIG;
