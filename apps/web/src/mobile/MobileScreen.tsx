import { copy } from '../shared/copy/id';

/** `/` placeholder; the mobile page is built in LOBBY-04. */
export function MobileScreen() {
  return (
    <main>
      <h1>{copy.mobile.title}</h1>
      <p>{copy.mobile.placeholder}</p>
    </main>
  );
}
