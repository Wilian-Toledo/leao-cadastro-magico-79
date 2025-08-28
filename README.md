# Welcome to your project

## How can I edit this code?

**Use your preferred IDE**

You can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
Edit a file directly in GitHub

Navigate to the desired file(s).

Click the "Edit" button (pencil icon) at the top right of the file view.

Make your changes and commit the changes.

Use GitHub Codespaces

Navigate to the main page of your repository.

Click on the "Code" button (green button) near the top right.

Select the "Codespaces" tab.

Click on "New codespace" to launch a new Codespace environment.

Edit files directly within the Codespace and commit and push your changes once you're done.

What technologies are used for this project?
This project is built with:

Vite

TypeScript

React

shadcn-ui

Tailwind CSS


---

#### **`index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cadastro Empresarial - Leão Alimentos e Bebidas</title>
    <meta name="description" content="Formulário de cadastro para empresas - Leão Alimentos e Bebidas" />
    <meta name="author" content="Leão Alimentos e Bebidas" />

    <meta property="og:title" content="Cadastro Empresarial - Leão Alimentos e Bebidas" />
    <meta property="og:description" content="Formulário de cadastro para empresas - Leão Alimentos e Bebidas" />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
src/components/RegistrationForm.tsx
A única alteração neste arquivo foi remover a referência à imagem do logo. A linha que continha o src="/lovable-uploads/..." foi alterada para um src vazio, para que você possa colocar a sua nova imagem lá.

TypeScript

// ... (imports)

// ... (resto do código)

export default function RegistrationForm() {
  // ... (código do componente)

  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-orange-light/20 to-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 bg-primary p-8 rounded-lg text-primary-foreground">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="" // <-- COLOQUE O CAMINHO PARA SEU LOGO AQUI
              alt="Leão Alimentos e Bebidas" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ficha Cadastral - Pessoa Jurídica</h1>
          <p className="opacity-90">Preencha todos os campos obrigatórios (*) para completar seu cadastro</p>
        </div>

        {/* ... (resto do formulário) */}
      </div>
    </div>
  );
}
