import { copy } from '../shared/copy/id';

/** `/tv` placeholder; the TV layout is built in LOBBY-03. */
export function TvScreen() {
  return (
    <main>
      <h1>{copy.tv.title}</h1>
      <p>{copy.tv.placeholder}</p>
    </main>
  );
}
