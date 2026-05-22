import './styles/main.css'

// App entry point — screens will be mounted here
const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <div class="flex items-center justify-center min-h-screen">
      <h1 class="text-4xl font-headline text-primary">Sproutdoro</h1>
    </div>
  `
}
