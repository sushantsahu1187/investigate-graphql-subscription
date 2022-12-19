import { useEffect } from "react";

export function CommentsPage({ subscribeToNewComments }: any) {
  useEffect(() => subscribeToNewComments(), []);
  return <>hello world ${new Date().getMilliseconds()}</>;
}
