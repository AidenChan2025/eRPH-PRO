import React, { useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { LessonRecord, WeeklySubmission, User, School } from '../../../types';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10,
        alignItems: 'center'
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 10
    },
    schoolInfo: {
        flexDirection: 'column'
    },
    schoolName: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    subHeader: {
        fontSize: 10,
        color: '#333'
    },
    titleSection: {
        marginBottom: 15,
        textAlign: 'center'
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5
    },
    weekInfo: {
        fontSize: 11,
        fontWeight: 'bold'
    },

    // Table
    daySection: {
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#000',
    },
    dayHeader: {
        backgroundColor: '#f0f0f0',
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        fontWeight: 'bold',
        fontSize: 11
    },
    lessonRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        padding: 5
    },
    timeCol: {
        width: '15%',
        fontSize: 9,
        fontWeight: 'bold'
    },
    contentCol: {
        width: '85%',
        paddingLeft: 5
    },
    subjectTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2
    },
    smallMeta: {
        fontSize: 12,
        color: '#444',
        marginBottom: 4
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        textDecoration: 'underline'
    },
    textBlock: {
        fontSize: 11,
        marginBottom: 2
    },

    // Footer / Signatures
    footer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyToShow: 'space-between'
    },
    signatureBox: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
        alignItems: 'center'
    },
    sigText: {
        fontSize: 9,
        marginBottom: 30
    }
});

interface WeeklyPlanPDFProps {
    submission: WeeklySubmission;
    lessons: LessonRecord[];
    teacher: User;
    school?: School;
}

const formatTime = (time: string) => {
    // Basic formatting if needed, typically stored as HH:mm
    return time;
};

export const WeeklyPlanPDF: React.FC<WeeklyPlanPDFProps> = ({ submission, lessons, teacher, school }) => {

    const lessonsByDay = useMemo(() => {
        const groups: Record<number, LessonRecord[]> = {};
        lessons.forEach(l => {
            if (!groups[l.day]) groups[l.day] = [];
            groups[l.day].push(l);
        });
        return groups;
    }, [lessons]);

    const sortedDays = [1, 2, 3, 4, 5, 6, 0].filter(d => lessonsByDay[d]?.length > 0);
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    {/* Logo placeholder if URL exists? React-PDF allows images. */}
                    <View style={styles.schoolInfo}>
                        <Text style={styles.schoolName}>{school?.name || 'Sekolah Kebangsaan Contoh'}</Text>
                        <Text style={styles.subHeader}>{school?.address || 'Alamat Sekolah, 12345 Bandar, Negeri'}</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>RANCANGAN PENGAJARAN HARIAN (RPH)</Text>
                    <Text style={styles.weekInfo}>
                        MINGGU {submission.week} (Tahun {submission.year})  |  {format(new Date(submission.startDate), 'dd MMMM yyyy')} - {format(new Date(submission.endDate), 'dd MMMM yyyy')}
                    </Text>
                    <Text style={styles.subHeader}>GURU: {teacher.name.toUpperCase()}</Text>
                </View>

                {/* Content */}
                {sortedDays.map(day => (
                    <View key={day} style={styles.daySection} wrap={false}>
                        <View style={styles.dayHeader}>
                            <Text>{DAYS[day].toUpperCase()} ({lessonsByDay[day][0].date})</Text>
                        </View>
                        {lessonsByDay[day].map((l, idx) => (
                            <View key={l.id} style={{ ...styles.lessonRow, borderBottomWidth: idx === lessonsByDay[day].length - 1 ? 0 : 1 }}>
                                <View style={styles.timeCol}>
                                    <Text>{l.startTime}</Text>
                                    <Text>-</Text>
                                    <Text>{l.endTime}</Text>
                                </View>
                                <View style={styles.contentCol}>
                                    <Text style={styles.subjectTitle}>{l.subjectId.replace(/_/g, ' ')}</Text>
                                    <Text style={styles.smallMeta}>Class: {l.classId}  |  Theme: {l.theme}</Text>

                                    {l.contentStandard && (
                                        <View>
                                            <Text style={styles.sectionTitle}>Standard Kandungan:</Text>
                                            <Text style={styles.textBlock}>{l.contentStandard}</Text>
                                        </View>
                                    )}

                                    {l.learningStandard && (
                                        <View>
                                            <Text style={styles.sectionTitle}>Standard Pembelajaran:</Text>
                                            <Text style={styles.textBlock}>{l.learningStandard}</Text>
                                        </View>
                                    )}

                                    {l.objectives && (
                                        <View>
                                            <Text style={styles.sectionTitle}>Objektif:</Text>
                                            <Text style={styles.textBlock}>{l.objectives}</Text>
                                        </View>
                                    )}

                                    {l.activities && (
                                        <View>
                                            <Text style={styles.sectionTitle}>Aktiviti:</Text>
                                            <Text style={styles.textBlock}>{l.activities}</Text>
                                        </View>
                                    )}

                                    {l.reflection && (
                                        <View>
                                            <Text style={styles.sectionTitle}>Refleksi:</Text>
                                            <Text style={styles.textBlock}>{l.reflection}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                ))}

                {/* Footer / Signatures */}
                <View style={styles.footer}>

                    {/* Teacher Signature / Digital Stamp */}
                    <View style={styles.signatureBox}>
                        <Text style={styles.sigText}>Disediakan oleh:</Text>

                        {submission.signatureUrl ? (
                            <View style={{
                                marginTop: 5,
                                padding: 5,
                                borderWidth: 1,
                                borderColor: '#2563eb', // Blue border for "Digital" feel
                                borderStyle: 'solid',
                                borderRadius: 4,
                                backgroundColor: '#f8fafc',
                                alignItems: 'center'
                            }}>
                                <Image
                                    src={submission.signatureUrl}
                                    style={{ width: 120, height: 60, objectFit: 'contain' }}
                                />
                                <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', width: '100%', marginTop: 4, paddingTop: 2 }}>
                                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' }}>
                                        DIGITALLY SIGNED
                                    </Text>
                                    <Text style={{ fontSize: 6, color: '#64748b', textAlign: 'center', marginTop: 1 }}>
                                        By: {teacher.name.toUpperCase()}
                                    </Text>
                                    <Text style={{ fontSize: 5, color: '#94a3b8', textAlign: 'center', marginTop: 1 }}>
                                        IP: {submission.ipAddress || 'Unknown'}
                                    </Text>
                                    <Text style={{ fontSize: 5, color: '#94a3b8', textAlign: 'center' }}>
                                        TS: {format(new Date(submission.submittedAt || new Date()), 'yyyy-MM-dd HH:mm:ss')}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#ccc' }}>(No Signature)</Text>
                            </View>
                        )}
                        <Text style={{ marginTop: 5, fontSize: 9 }}>Tarikh: {format(new Date(submission.submittedAt || new Date()), 'dd/MM/yyyy')}</Text>
                    </View>

                    <View style={{ flex: 1 }}></View>

                    {/* Admin Verification */}
                    <View style={styles.signatureBox}>
                        <Text style={styles.sigText}>Disemak & Disahkan oleh:</Text>

                        {/* Placeholder for Admin Signature/Stamp */}
                        <View style={{ height: 80 }} />

                        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>..........................................</Text>
                        <Text style={{ marginTop: 2 }}>Tarikh: ....................</Text>
                    </View>
                </View>

            </Page>
        </Document>
    )
};
