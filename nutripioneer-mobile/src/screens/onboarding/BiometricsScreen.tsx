import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricsScreen() {
    const navigation = useNavigation();
    const { biometrics, updateData, nextStep, prevStep } = useOnboardingStore();
    const [unit, setUnit] = useState<'metric' | 'imperial'>(biometrics.unit || 'metric');

    const [displayValues, setDisplayValues] = useState({
        age: biometrics.age?.toString() || '',
        height: biometrics.height?.toString() || '',
        heightFt: '',
        heightIn: '',
        weight: biometrics.weight?.toString() || '',
        waist: biometrics.waist?.toString() || '',
    });

    useEffect(() => {
        if (unit === 'metric') {
            setDisplayValues((prev) => ({
                ...prev,
                height: biometrics.height?.toString() || '',
                weight: biometrics.weight?.toString() || '',
                waist: biometrics.waist?.toString() || '',
                age: biometrics.age?.toString() || '',
            }));
        } else {
            const h = biometrics.height || 0;
            const w = biometrics.weight || 0;
            const wst = biometrics.waist || 0;

            const totalInches = h / 2.54;
            const ft = Math.floor(totalInches / 12);
            const inch = Math.round(totalInches % 12);

            setDisplayValues((prev) => ({
                ...prev,
                heightFt: h ? ft.toString() : '',
                heightIn: h ? inch.toString() : '',
                weight: w ? (w * 2.20462).toFixed(1) : '',
                waist: wst ? (wst / 2.54).toFixed(1) : '',
                age: biometrics.age?.toString() || '',
            }));
        }
    }, [unit]);

    const toggleUnit = (newUnit: 'metric' | 'imperial') => {
        setUnit(newUnit);
        updateData('biometrics', { unit: newUnit });
    };

    const handleAgeChange = (val: string) => {
        setDisplayValues((prev) => ({ ...prev, age: val }));
        const num = parseFloat(val);
        if (!isNaN(num)) updateData('biometrics', { age: num });
    };

    const handleMetricChange = (field: 'height' | 'weight' | 'waist', val: string) => {
        setDisplayValues((prev) => ({ ...prev, [field]: val }));
        const num = parseFloat(val);
        if (!isNaN(num)) {
            updateData('biometrics', { [field]: num });
        }
    };

    const handleImperialSimpleChange = (field: 'weight' | 'waist', val: string) => {
        setDisplayValues((prev) => ({ ...prev, [field]: val }));
        const num = parseFloat(val);
        if (!isNaN(num)) {
            if (field === 'weight') {
                updateData('biometrics', { weight: parseFloat((num / 2.20462).toFixed(1)) });
            } else if (field === 'waist') {
                updateData('biometrics', { waist: parseFloat((num * 2.54).toFixed(1)) });
            }
        }
    };

    const handleImperialHeightChange = (type: 'ft' | 'in', val: string) => {
        const newValues = {
            ...displayValues,
            [type === 'ft' ? 'heightFt' : 'heightIn']: val,
        };
        setDisplayValues(newValues);

        const ft = parseFloat(newValues.heightFt) || 0;
        const inch = parseFloat(newValues.heightIn) || 0;
        const totalInches = ft * 12 + inch;
        const cm = totalInches * 2.54;

        updateData('biometrics', { height: cm });
    };

    const handleNext = () => {
        nextStep();
        navigation.navigate('OnboardingMedical' as never);
    };

    const handleBack = () => {
        prevStep();
        navigation.goBack();
    };

    const isNextDisabled = !biometrics.age || !biometrics.height || !biometrics.weight || !biometrics.gender;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Let's get those numbers.</Text>

                    <View style={styles.unitToggleContainer}>
                        <TouchableOpacity
                            style={[styles.unitToggle, unit === 'metric' && styles.unitToggleActive]}
                            onPress={() => toggleUnit('metric')}
                        >
                            <Text style={[styles.unitText, unit === 'metric' && styles.unitTextActive]}>Metric</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitToggle, unit === 'imperial' && styles.unitToggleActive]}
                            onPress={() => toggleUnit('imperial')}
                        >
                            <Text style={[styles.unitText, unit === 'imperial' && styles.unitTextActive]}>Imperial</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.grid}>
                    {/* Age and Gender */}
                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.glassInput}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="numeric"
                                    value={displayValues.age}
                                    onChangeText={handleAgeChange}
                                />
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderContainer}>
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.genderButton,
                                            biometrics.gender === g && styles.genderButtonActive,
                                        ]}
                                        onPress={() => updateData('biometrics', { gender: g })}
                                    >
                                        <Text
                                            style={[
                                                styles.genderText,
                                                biometrics.gender === g && styles.genderTextActive,
                                            ]}
                                        >
                                            {g[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Height */}
                    <View style={styles.inputGroupFull}>
                        <Text style={styles.label}>Height {unit === 'metric' ? '(cm)' : '(ft / in)'}</Text>
                        {unit === 'metric' ? (
                            <View style={styles.glassInput}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="numeric"
                                    value={displayValues.height}
                                    onChangeText={(val) => handleMetricChange('height', val)}
                                />
                            </View>
                        ) : (
                            <View style={styles.multiInputRow}>
                                <View style={[styles.glassInput, { flex: 1, marginRight: 8 }]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ft"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        keyboardType="numeric"
                                        value={displayValues.heightFt}
                                        onChangeText={(val) => handleImperialHeightChange('ft', val)}
                                    />
                                </View>
                                <View style={[styles.glassInput, { flex: 1, marginLeft: 8 }]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="in"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        keyboardType="numeric"
                                        value={displayValues.heightIn}
                                        onChangeText={(val) => handleImperialHeightChange('in', val)}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Weight */}
                    <View style={styles.inputGroupFull}>
                        <Text style={styles.label}>Weight {unit === 'metric' ? '(kg)' : '(lbs)'}</Text>
                        <View style={styles.glassInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="0.0"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                keyboardType="numeric"
                                value={displayValues.weight}
                                onChangeText={(val) =>
                                    unit === 'metric'
                                        ? handleMetricChange('weight', val)
                                        : handleImperialSimpleChange('weight', val)
                                }
                            />
                        </View>
                    </View>

                    {/* Waist */}
                    <View style={styles.inputGroupFull}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Waist {unit === 'metric' ? '(cm)' : '(in)'}</Text>
                            <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
                        </View>
                        <View style={styles.glassInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="Optional"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                keyboardType="numeric"
                                value={displayValues.waist}
                                onChangeText={(val) =>
                                    unit === 'metric'
                                        ? handleMetricChange('waist', val)
                                        : handleImperialSimpleChange('waist', val)
                                }
                            />
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
                        onPress={handleNext}
                        disabled={isNextDisabled}
                    >
                        <Text style={styles.nextText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        marginRight: 16,
    },
    unitToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 4,
    },
    unitToggle: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    unitToggleActive: {
        backgroundColor: '#fff',
    },
    unitText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
    },
    unitTextActive: {
        color: '#111827',
    },
    grid: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    inputGroup: {
        flex: 1,
        marginRight: 16,
    },
    inputGroupFull: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    label: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    glassInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    input: {
        color: '#fff',
        fontSize: 18,
    },
    multiInputRow: {
        flexDirection: 'row',
    },
    genderContainer: {
        flexDirection: 'row',
        height: 56,
        gap: 8,
    },
    genderButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderButtonActive: {
        backgroundColor: '#13ec5b',
        borderColor: '#13ec5b',
    },
    genderText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
    },
    genderTextActive: {
        color: '#000',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 20,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    backText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#13ec5b',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 28,
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
});
