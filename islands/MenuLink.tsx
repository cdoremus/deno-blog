export default function MenuLink() {
  const link = globalThis.location?.href?.endsWith("/") ? "/about" : "/";
  const linkText = globalThis.location?.href?.endsWith("/") ? "About" : "Home";
  return (
    <div class="text-right text-m">
      <a class="underline" href={link}>{linkText}</a>
    </div>
  );
}
