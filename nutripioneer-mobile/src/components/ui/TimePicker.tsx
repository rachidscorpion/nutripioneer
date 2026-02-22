import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimePickerProps {
    value: string; // HH:MM string like "08:00"
    onChange: (val: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
    const [show, setShow] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null);

    const getDateFromValue = (timeStr: string) => {
        const d = new Date();
        if (timeStr && timeStr.includes(':')) {
            const [hours, minutes] = timeStr.split(':');
            d.setHours(parseInt(hours, 10));
            d.setMinutes(parseInt(minutes, 10));
        }
        return d;
    };

    const displayDate = tempDate || getDateFromValue(value);

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
            if (event.type === 'set' && selectedDate) {
                const hours = selectedDate.getHours().toString().padStart(2, '0');
                const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                onChange(`${hours}:${minutes}`);
            }
        } else {
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const handleSave = () => {
        if (tempDate) {
            const hours = tempDate.getHours().toString().padStart(2, '0');
            const minutes = tempDate.getMinutes().toString().padStart(2, '0');
            onChange(`${hours}:${minutes}`);
        }
        setShow(false);
        setTempDate(null);
    };

    const handleCancel = () => {
        setShow(false);
        setTempDate(null);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    setTempDate(getDateFromValue(value));
                    setShow(true);
                }}
            >
                <Ionicons name="time-outline" size={16} color="#9ca3af" />
                <Text style={styles.timeText}>{value || '00:00'}</Text>
            </TouchableOpacity>

            {/* Android Picker */}
            {show && Platform.OS === 'android' && (
                <DateTimePicker
                    value={displayDate}
                    mode="time"
                    display="default"
                    onChange={handleChange}
                />
            )}

            {/* iOS Modal Picker */}
            {Platform.OS === 'ios' && (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={show}
                    onRequestClose={handleCancel}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={styles.modalBackdrop} onPress={handleCancel} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select Time</Text>
                                <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
                                    <Text style={styles.saveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.pickerContainer}>
                                <DateTimePicker
                                    value={displayDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={handleChange}
                                    textColor="#fff"
                                    themeVariant="dark"
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    timeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#1c1c1e',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    headerBtn: {
        padding: 8,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelText: {
        color: '#e4e4e7',
        fontSize: 16,
    },
    saveText: {
        color: '#13ec5b',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pickerContainer: {
        backgroundColor: '#1c1c1e',
        paddingTop: 16,
        alignItems: 'center',
    }
});
