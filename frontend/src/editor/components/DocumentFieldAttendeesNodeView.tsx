import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listUsers } from '../../services/organization/usersService';
import { useAuthStore } from '../../shared/store/authStore';
import {
    ATTENDEES_PLACEHOLDER_TEXT,
    ATTENDEES_STYLES,
    normalizeAttendees,
} from '../utils/documentFieldAttendees';
import { AttendeeSelectDialog } from './AttendeeSelectDialog';

export function DocumentFieldAttendeesNodeView(props: NodeViewProps) {
    const { node, editor, updateAttributes } = props;
    const attendees = normalizeAttendees(node.attrs.attendees);
    const [open, setOpen] = useState(false);
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const usersQuery = useQuery({
        queryKey: ['users', tenantCode, 'document-field-attendees'],
        queryFn: () => listUsers(tenantCode),
        enabled: open && Boolean(tenantCode),
        retry: 1,
    });

    const handleOpen = () => {
        if (editor.isEditable) {
            setOpen(true);
        }
    };

    return (
        <NodeViewWrapper as="div" contentEditable={false}>
            <div
                onClick={handleOpen}
                style={{ cursor: editor.isEditable ? 'pointer' : 'default' }}
            >
                {attendees.length === 0 ? (
                    <div style={ATTENDEES_STYLES.placeholder}>
                        {ATTENDEES_PLACEHOLDER_TEXT}
                    </div>
                ) : (
                    <div style={ATTENDEES_STYLES.list}>
                        {attendees.map((attendee) => (
                            <div key={attendee.userId} style={ATTENDEES_STYLES.card}>
                                <div style={ATTENDEES_STYLES.name}>{attendee.name}</div>
                                <div style={ATTENDEES_STYLES.sign}>
                                    {attendee.signatureImage ? (
                                        <img
                                            src={attendee.signatureImage}
                                            alt={`${attendee.name} 서명`}
                                            style={ATTENDEES_STYLES.image}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {open ? (
                <AttendeeSelectDialog
                    users={usersQuery.data ?? []}
                    loading={usersQuery.isLoading}
                    selected={attendees}
                    onClose={() => setOpen(false)}
                    onConfirm={(next) => {
                        updateAttributes({ attendees: next });
                        setOpen(false);
                    }}
                />
            ) : null}
        </NodeViewWrapper>
    );
}