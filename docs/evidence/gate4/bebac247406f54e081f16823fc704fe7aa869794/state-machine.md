# Gate 4 state machine

Slot states are `draft -> submitted -> returned -> submitted -> approved -> archived`; versions are append-only and reviews retain reviewer, decision and comment.

Weekly state is derived independently. Empty/draft-only weeks are `draft`; every returned Slot is `returned`; a mixture containing at least one returned and at least one submitted or approved Slot is `partially_returned`; all approved/archived Slots are `approved`.

Teacher ownership is school-scoped. Employment history records school periods. After transfer, original-school drafts and return comments are unavailable; approved and archived records remain read-only according to policy. Relief RPH retains `is_relief` and `relief_reason`, while single-lesson and weekly outputs use the normalized dictionary.
