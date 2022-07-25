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
        const postFile = file.split(".");
        const linkText = postFile[0].replaceAll("_", " ");
        return (<li><a class={tw`text-xl`} href={`/${postFile[0]}.${postFile[1]}`}>{linkText} - {postFile[1]}</a></li>)
      })
    }
    </ul>
  )
}