import type { UserItem } from '../../services/organization/usersService';
import { UserMultiSelectDialog } from '../../shared/components/forms/UserMultiSelectDialog';
import type { DocumentFieldAttendee } from '../utils/documentFieldAttendees';

type AttendeeSelectDialogProps = {
    users: UserItem[];
    loading?: boolean;
    selected: DocumentFieldAttendee[];
    onClose: () => void;
    onConfirm: (attendees: DocumentFieldAttendee[]) => void;
};

function toAttendee(user: UserItem): DocumentFieldAttendee {
    return user.signatureImage
        ? { userId: user.id, name: user.name, signatureImage: user.signatureImage }
        : { userId: user.id, name: user.name };
}

// 기존 -> 체크 상태, 부서 체크, 전체선택, dialog 화면을 이 파일에서 직접 처리
// 변경 -> 공통 UserMultiSelectDialog 에 맡기고 id -> 참석자 변환만 처리
export function AttendeeSelectDialog(props: AttendeeSelectDialogProps) {
    const { users, loading = false, selected, onClose, onConfirm } = props;

    const handleConfirm = (userIds: string[]) => {
        const attendees = userIds.flatMap((userId) => {
            const existing = selected.find((attendee) => attendee.userId === userId);
            if (existing) {
                return [existing];
            }

            const user = users.find((item) => item.id === userId);
            return user ? [toAttendee(user)] : [];
        });

        onConfirm(attendees);
    };

    return (
        <UserMultiSelectDialog
            users={users}
            loading={loading}
            title="참석자 선택"
            selectedUserIds={selected.map((attendee) => attendee.userId)}
            onClose={onClose}
            onConfirm={handleConfirm}
        />
    );
}
