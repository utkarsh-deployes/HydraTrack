import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

type GoalLevel = 'basic' | 'active' | 'intense';

type SipSlot = {
  time: string;
  amount: number;
};

const parseTimeToMinutes = (time: string): number | null => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (total: number): string => {
  total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

const App = () => {
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [goal, setGoal] = useState<GoalLevel>('basic');
  const [wakeTime, setWakeTime] = useState<string>('07:00');
  const [sleepTime, setSleepTime] = useState<string>('23:00');

  const [dailyIntake, setDailyIntake] = useState<number | null>(null);
  const [sipPlan, setSipPlan] = useState<SipSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const calculateWater = () => {
    setError(null);

    const w = parseFloat(weight);
    const a = parseInt(age || '0', 10);

    if (isNaN(w) || w <= 0) {
      setDailyIntake(null);
      setSipPlan([]);
      setError('Please enter a valid weight in kg.');
      return;
    }

    let ml = w * 35;

    if (!isNaN(a) && a > 55) {
      ml *= 0.9;
    }

    if (goal === 'active') {
      ml += 400;
    } else if (goal === 'intense') {
      ml += 800;
    }

    const rounded = Math.round(ml);
    setDailyIntake(rounded);

    const wakeMinutes = parseTimeToMinutes(wakeTime);
    const sleepMinutes = parseTimeToMinutes(sleepTime);

    if (wakeMinutes == null || sleepMinutes == null) {
      setSipPlan([]);
      setError(
        'Time format should be HH:MM (24-hour). Example: 07:00 or 21:30.',
      );
      return;
    }

    let span = sleepMinutes - wakeMinutes;
    if (span <= 0) {
      span += 24 * 60;
    }

    let approxSlots = Math.round(span / 120);
    approxSlots = Math.min(Math.max(approxSlots, 4), 12);

    const interval = span / approxSlots;
    const amountPerSlot = Math.round(rounded / approxSlots);

    const slots: SipSlot[] = [];
    for (let i = 0; i < approxSlots; i++) {
      const t = wakeMinutes + i * interval;
      slots.push({
        time: minutesToTime(Math.round(t)),
        amount: amountPerSlot,
      });
    }
    setSipPlan(slots);
  };

  const renderDailyLabel = () => {
    if (!dailyIntake) return null;
    const liters = (dailyIntake / 1000).toFixed(2);
    return `${dailyIntake} ml • ~${liters} L / day`;
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.appTitle}>Hydratrack</Text>
          <Text style={styles.subtitle}>
            Gentle reminders to keep you evenly hydrated through the day.
          </Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your basics</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="e.g. 65"
                placeholderTextColor="#9ca3af"
                value={weight}
                onChangeText={setWeight}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Age (optional)</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="e.g. 22"
                placeholderTextColor="#9ca3af"
                value={age}
                onChangeText={setAge}
                style={styles.input}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Day window
            </Text>

            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Wake-up</Text>
                <TextInput
                  placeholder="07:00"
                  placeholderTextColor="#9ca3af"
                  value={wakeTime}
                  onChangeText={setWakeTime}
                  style={styles.input}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Sleep</Text>
                <TextInput
                  placeholder="23:00"
                  placeholderTextColor="#9ca3af"
                  value={sleepTime}
                  onChangeText={setSleepTime}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Activity level
            </Text>

            <View style={styles.goalRow}>
              {(['basic', 'active', 'intense'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGoal(g)}
                  style={[
                    styles.chip,
                    goal === g && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      goal === g && styles.chipTextSelected,
                    ]}
                  >
                    {g === 'basic'
                      ? 'Calm'
                      : g === 'active'
                      ? 'Active'
                      : 'Intense'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.button} onPress={calculateWater}>
              <Text style={styles.buttonText}>Calculate plan</Text>
            </Pressable>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {dailyIntake && !error && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Daily target</Text>
                <Text style={styles.resultText}>{renderDailyLabel()}</Text>
                <Text style={styles.resultHint}>
                  Aim to drink this gradually between your wake-up and
                  sleep time — not in one go.
                </Text>

                {sipPlan.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.planTitle}>Today&apos;s sip plan</Text>
                    {sipPlan.map((slot, idx) => (
                      <View key={`${slot.time}-${idx}`} style={styles.slotRow}>
                        <Text style={styles.slotTime}>{slot.time}</Text>
                        <Text style={styles.slotAmount}>
                          {slot.amount} ml
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            v0.2 • Simple schedule only. Local notifications can be added later.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: 36,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5f2ff',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#9ca3af',
  },
  card: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  field: {
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#e5e7eb',
    backgroundColor: '#020617',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  chipText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  chipTextSelected: {
    color: '#0b1120',
    fontWeight: '600',
  },
  button: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 11,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#022c22',
  },
  resultBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bbf7d0',
  },
  resultText: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#bbf7d0',
  },
  resultHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#9ca3af',
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 6,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  slotTime: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  slotAmount: {
    fontSize: 13,
    color: '#bbf7d0',
    fontWeight: '500',
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 10,
    color: '#f97373',
    fontSize: 12,
  },
});

export default App;
