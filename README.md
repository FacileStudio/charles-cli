# 🦉 Charles Document Generator

This project provides an interactive script to generate various Typst documents (quotes, maintenance contracts).

## Setup

1.  **Install Bun**: If you don't have Bun installed, follow the instructions on their official website: [https://bun.sh](https://bun.sh)
2.  **Install Typst**: Make sure Typst is installed and available in your PATH. Refer to the Typst documentation for installation instructions.

## Usage

1.  **Run the generator**:
    ```bash
    bun run start
    ```
    or, since `index.ts` is executable:
    ```bash
    ./index.ts
    ```

2.  **Follow the prompts**: The script will interactively ask you for client details, product/service information, and which documents you want to generate.

3.  **Generated Files**: The generated `.typ` files and their compiled `.pdf` versions will be created in the root directory of this project, named like `generated-devis-prestation-<client_name>.typ` and `generated-devis-prestation-<client_name>.pdf`.

## Demo

![demo](demo.gif)


## Document Templates

The templates are located in the `templates/` directory:

*   `contrat-maintenance.typ`: Template for maintenance contracts.
*   `devis-maintenance.typ`: Template for maintenance quotes.
*   `devis-prestation.typ`: Template for general service quotes.

These templates contain placeholders (e.g., `{{client_name}}`, `{{items}}`) that are dynamically replaced by the script.

## Job Configuration (`job.yml`)

The `job.yml` file serves as a central configuration for defining all the dynamic data used in document generation. It allows you to pre-fill details for service providers, clients, service prestations, maintenance contracts, and general contract information.

### Structure of `job.yml`

*   **`prestataire`**: Contains details about the service provider (e.g., name, address, bank details).
*   **`client`**: Contains details about the client (e.g., name, address).
*   **`prestation`**: Details about specific services provided, including a number, date, due date, and a list of service items with descriptions, quantities, units, and prices.
*   **`maintenance`**: Information related to maintenance contracts, such as number, date, period, estimated railway, and maintenance items.
*   **`contrat`**: General contract information like reference, date, and desired output file name.

By modifying this file, you can quickly generate documents with consistent and pre-defined information without needing to interactively input all details each time.

## Customization

You can modify the `.typ` templates in the `templates/` directory to change the layout or content of the generated documents. Ensure that you maintain the placeholder format (`{{placeholder_name}}`) for the script to function correctly.
