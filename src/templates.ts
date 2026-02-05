export const templates = {
  prestation: `#set document(
  title: "Facture",
  author: "{{provider_name}}"
)

#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2cm, right: 2cm),
  numbering: "1 / 1",
  number-align: right + bottom,
)

#set text(
  font: "Satoshi",
  size: 10pt,
  lang: "fr"
)

// Variables mappées par Charles
#let invoice_number = "{{invoice_number}}"
#let invoice_date = "{{invoice_date}}"
#let due_date = "{{due_date}}"

// Informations client
#let client_name = "{{client_name}}"
#let client_address = "{{client_address}}"
#let client_city = "{{client_city}}"
#let client_country = "{{client_country}}"
#let client_siret = "{{client_siret}}"

// Informations prestataire
#let provider_name = "{{provider_name}}"
#let provider_address = "{{provider_address}}"
#let provider_city = "{{provider_city}}"
#let provider_country = "{{provider_country}}"
#let provider_siret = "{{provider_siret}}"
#let provider_email = "{{provider_email}}"
#let provider_phone = "{{provider_phone}}"

// Détails de facturation
#let items = (
  {{items}}
)

#let tva_rate = {{tva_rate}} 

// Informations bancaires
#let bank_name = "{{bank_name}}"
#let iban = "{{iban}}"
#let bic = "{{bic}}"

// === En-tête ===
#grid(
  columns: (1fr, 1fr),
  column-gutter: 2cm,

  align(left)[
    #text(size: 24pt, weight: "bold")[#provider_name]
    #v(0.5cm)
    #text(size: 9pt, fill: rgb("#666666"))[
      #provider_address \
      #provider_city, #provider_country \
      SIRET: #provider_siret \
      #provider_email \
      #provider_phone
    ]
  ],

  align(right)[
    #text(size: 20pt, weight: "bold", fill: rgb("#F97316"))[FACTURE]
    #v(0.3cm)
    #table(
      columns: (auto, auto),
      stroke: none,
      align: (left, right),
      row-gutter: 0.2cm,

      text(weight: "bold")[N°], text[#invoice_number],
      text(weight: "bold")[Date], text[#invoice_date],
      text(weight: "bold")[Échéance], text[#due_date],
    )
  ]
)

#v(1.5cm)

// === Informations client ===
#rect(
  width: 100%,
  fill: rgb("#f8f9fa"),
  stroke: none,
  radius: 4pt,
  inset: 1cm,
)[
  #text(size: 8pt, weight: "bold", fill: rgb("#666666"))[FACTURER À]
  #v(0.3cm)
  #text(size: 11pt, weight: "bold")[#client_name]
  #v(0.2cm)
  #client_address \
  #client_city \
  #client_country \
  #if client_siret != "" and client_siret != "0" [SIRET: #client_siret]
]

#v(1.5cm)

// === Tableau des prestations ===
#let subtotal = if items.len() > 0 { items.map(item => item.quantity * item.price).sum() } else { 0 }
#let tva_amount = subtotal * tva_rate / 100
#let total = subtotal + tva_amount

#table(
  columns: (1fr, 0.15fr, 0.15fr, 0.2fr, 0.2fr),
  stroke: (x, y) => {
    if y == 0 { (bottom: 1.5pt + rgb("#333333")) }
    else if y == items.len() { (bottom: 0.5pt + rgb("#cccccc")) }
    else { none }
  },
  inset: 0.5cm,
  align: (left, center, center, right, right),

  [*Description*], [*Qté*], [*Unité*], [*P.U. HT*], [*Total HT*],

  ..items.map(item => (
    item.description,
    str(item.quantity),
    item.unit,
    str(item.price) + " €",
    str(item.quantity * item.price) + " €"
  )).flatten()
)

#v(0.5cm)

// === Totaux ===
#align(right)[
  #table(
    columns: (auto, 100pt),
    stroke: none,
    column-gutter: 1cm,
    row-gutter: 0.3cm,
    align: (right, right),

    [Sous-total HT], [*#str(subtotal) €*],
    [TVA (#tva_rate%)], [#str(tva_amount) €],
    table.hline(stroke: 1.5pt + rgb("#333333")),
    text(size: 12pt, weight: "bold")[TOTAL TTC],
    text(size: 12pt, weight: "bold", fill: rgb("#F97316"))[#str(total) €],
  )
]

#v(1fr)

// === Informations de paiement ===
#rect(
  width: 100%,
  fill: rgb("#FFEFE4"),
  stroke: 0.5pt + rgb("#F97316"),
  radius: 4pt,
  inset: 1cm,
)[
  *Informations de paiement* \
  #v(0.2cm)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 0.5cm,
    row-gutter: 0.2cm,
    [Banque:], [#bank_name],
    [IBAN:], [#text(font: "Courier")[#iban]],
    [BIC:], [#text(font: "Courier")[#bic]],
  )
  #v(0.2cm)
  #text(size: 9pt, style: "italic")[Paiement attendu avant le #due_date]
]

#v(0.5cm)

// === Mentions légales ===
#text(size: 8pt, fill: rgb("#666666"))[
  #align(center)[
    #provider_name \
    TVA non applicable, article 293 B du CGI \
    Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40€.
  ]
]
`,

  maintenance: `#set document(title: "Devis Maintenance", author: "{{provider_name}}")
#set page(paper: "a4", margin: 2cm, numbering: "1 / 1", number-align: right + bottom)
#set text(font: "Satoshi", size: 10pt, lang: "fr")

#let quote_number = "{{quote_number}}"
#let quote_date = "{{quote_date}}"
#let validity_date = "{{due_date}}"
#let maintenance_period = "{{maintenance_period}}"
#let railway_estimate = "{{railway_estimate}}"

#let client_name = "{{client_name}}"
#let client_address = "{{client_address}}"
#let client_city = "{{client_city}}"

#let provider_name = "{{provider_name}}"
#let provider_address = "{{provider_address}}"
#let provider_city = "{{provider_city}}"

#let items = ({{items}})
#let tva_rate = {{tva_rate}}

#grid(
  columns: (1fr, 1fr),
  [#text(size: 20pt, weight: "bold")[#provider_name]],
  align(right)[#text(size: 20pt, weight: "bold", fill: blue)[DEVIS MAINTENANCE]]
)

#v(1cm)
#rect(width: 100%, fill: rgb("#f0f4f8"), inset: 15pt)[
  *Période concernée :* #maintenance_period \
  *Estimation frais serveurs (Railway) :* #railway_estimate € / mois (indicatif)
]

#v(1cm)
#let subtotal = if items.len() > 0 { items.map(item => item.quantity * item.price).sum() } else { 0 }
#table(
  columns: (1fr, 80pt, 80pt),
  inset: 10pt,
  [*Description*], [*Quantité*], [*Total HT*],
  ..items.map(item => (item.description, [#item.quantity #item.unit], [#(item.quantity * item.price) €])).flatten()
)

#v(1cm)
#text(size: 9pt, style: "italic")[
  Note : La maintenance est facturée mensuellement. Ce devis est valable jusqu'au #validity_date.
]
`,

  contrat: `#set document(title: "Contrat de maintenance", author: "{{provider_name}}")
#set page(paper: "a4", margin: 2.5cm)
#set text(font: "Satoshi", size: 10pt, lang: "fr")

#let contract_date = "{{contract_date}}"
#let contract_ref = "{{ref}}"
#let provider_name = "{{provider_name}}"
#let provider_legal = "{{provider_legal_form}}"
#let client_name = "{{client_name}}"

#align(center)[
  #text(size: 18pt, weight: "bold")[CONTRAT DE MAINTENANCE APPLICATIVE] \
  #text(size: 10pt)[Référence : #contract_ref | Date : #contract_date]
]

#v(1cm)
*Entre les soussignés :* \
#provider_name, #provider_legal, domicilié à {{provider_address}}, {{provider_city}}. \
Ci-après "Le Prestataire".

#v(0.5cm)
*Et :* \
#client_name, domicilié à {{client_address}}, {{client_city}}. \
Ci-après "Le Client".

#v(1cm)
*Article 1 - Objet* \
Le présent contrat définit les conditions de maintenance technique et de surveillance de l'application du Client par le Prestataire.

*Article 2 - Hébergement* \
L'application est hébergée sur Railway. Les frais sont refacturés au coût réel sans marge par le Prestataire.

*Article 3 - Durée* \
Le contrat est conclu pour une durée indéterminée avec un préavis de résiliation de 30 jours.

#v(2cm)
#grid(
  columns: (1fr, 1fr),
  [Signature Prestataire :],
  [Signature Client :]
)
`
};
