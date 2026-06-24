import { DraftEditor } from "@/components/draft-editor";
import { TeacherShell } from "@/components/teacher-shell";

type Props = {
  params: Promise<{ draftId: string }>;
};

export default async function DraftPage({ params }: Props) {
  const { draftId } = await params;

  return (
    <TeacherShell>
      <div className="page-inner wide">
        <DraftEditor draftId={draftId} />
      </div>
    </TeacherShell>
  );
}
