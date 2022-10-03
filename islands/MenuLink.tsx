
export default function MenuLink() {
  const link = window.location?.href?.endsWith("/") ? "/about" : "/"
  const linkText = window.location?.href?.endsWith("/") ? "About" : "Home"
  return (
    <div class="text-right text-m">
      <a class="underline" href={link}>{linkText}</a>
    </div>
  )
}