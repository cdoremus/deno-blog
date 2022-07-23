/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";

type PostListProps = {
  files: string[];
}

export default function PostList(props: PostListProps) {
  const {files} = props;
  return (
    <ul class={tw`list-disc`}>
    {
      files.map((file:string ) => {
        const linkText = file.replaceAll("_", " ");
        return (<li><a class={tw`text-xl`} href={`/${file}`}>{linkText}</a></li>)
      })
    }
    </ul>
  )
}