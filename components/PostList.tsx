type PostListProps = {
  files: string[];
};

export default function PostList(props: PostListProps) {
  const { files } = props;
  return (
    <ul class="list-disc ml-5 mr-5 group">
      {files.map((file: string) => {
        const postFile = file.split(".");
        const linkText = postFile[0].replaceAll("_", " ");
        return (
          <li>
            <a class="text-xl hover:underline" href={`/${postFile[0]}.${postFile[1]}`}>
              {linkText} - {postFile[1]}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
