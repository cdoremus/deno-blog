/** @jsx h */
import {h} from "preact";
import { tw } from "twind";


export default function MenuLink() {
  const link = window.location?.href?.endsWith("/") ? "/about" : "/"
  const linkText = window.location?.href?.endsWith("/") ? "About" : "Home"
  return (
    <div class={tw`text-right text-m`}>
      <a href={link}>{linkText}</a>
    </div>
  )
}