import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface NPModalProps {
  visible: boolean;
  title: string;
  description?: string | ReactNode;
  onClose?: () => void;
  hideCloseIcon?: boolean;
  actions?: ReactNode;
}

export default function NPModal({
  visible,
  title,
  description,
  onClose,
  hideCloseIcon = false,
  actions,
}: NPModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {!hideCloseIcon && onClose && (
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content} bounces={false}>
            {typeof description === 'string' ? (
              <Text style={[styles.description, { color: theme.text }]}>{description}</Text>
            ) : (
              description
            )}
          </ScrollView>

          {actions && <View style={[styles.actions, { borderTopColor: theme.border }]}>{actions}</View>}
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 500,
    maxHeight: height * 0.8,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});
