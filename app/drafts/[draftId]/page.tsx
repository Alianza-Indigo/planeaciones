import { AppShell } from "@/components/app-shell";
import { DraftEditor } from "@/components/draft-editor";

type Props = {
  params: Promise<{ draftId: string }>;
};

export default async function DraftPage({ params }: Props) {
  const { draftId } = await params;

  return (
    <AppShell>
      <DraftEditor draftId={draftId} />
    </AppShell>
  );
}
