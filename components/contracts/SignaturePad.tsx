import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';
import { Button } from '@components/ui/Button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
  visible: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClose,
  title = 'Sign Here',
  description = 'Please sign in the box below',
  visible,
}) => {
  const signatureRef = useRef<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleSignature = (signatureData: string) => {
    setSignature(signatureData);
    setIsEmpty(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignature(null);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (!signature) {
      Alert.alert('No Signature', 'Please provide a signature before saving.');
      return;
    }

    onSave(signature);
    handleClear();
  };

  const handleConfirmClose = () => {
    if (!isEmpty) {
      Alert.alert(
        'Unsigned Changes',
        'You have an unsaved signature. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Close',
            style: 'destructive',
            onPress: () => {
              handleClear();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleEnd = () => {
    // Signature drawing ended
  };

  const handleEmpty = () => {
    setIsEmpty(true);
  };

  const htmlStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: 2px dashed ${Colors.borderMedium};
      background-color: ${Colors.white};
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleConfirmClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleConfirmClose}>
            <Icon name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.description}>{description}</Text>

          {/* Signature Canvas */}
          <View style={styles.signatureContainer}>
            <Signature
              ref={signatureRef}
              onOK={handleSignature}
              onEnd={handleEnd}
              onEmpty={handleEmpty}
              descriptionText=""
              clearText=""
              confirmText=""
              webStyle={htmlStyle}
              autoClear={false}
              imageType="image/png"
              style={styles.signature}
            />
            
            {/* Canvas Placeholder */}
            {isEmpty && (
              <View style={styles.placeholder}>
                <Icon name="edit-3" size={48} color={Colors.gray400} />
                <Text style={styles.placeholderText}>
                  Draw your signature here
                </Text>
              </View>
            )}
          </View>

          {/* Signature Preview */}
          {signature && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview:</Text>
              <View style={styles.preview}>
                <img
                  src={signature}
                  style={styles.previewImage}
                  alt="signature preview"
                />
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionItem}>
              <Icon name="check-circle" size={16} color={Colors.success500} />
              <Text style={styles.instructionText}>
                Sign clearly within the box
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="check-circle" size={16} color={Colors.success500} />
              <Text style={styles.instructionText}>
                Use your finger or stylus
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="check-circle" size={16} color={Colors.success500} />
              <Text style={styles.instructionText}>
                This is a legally binding signature
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="Clear"
            onPress={handleClear}
            variant="outline"
            icon={<Icon name="trash-2" size={20} color={Colors.danger500} />}
            disabled={isEmpty}
            style={styles.clearButton}
          />
          <View style={styles.spacer} />
          <Button
            title="Cancel"
            onPress={handleConfirmClose}
            variant="ghost"
            style={styles.cancelButton}
          />
          <Button
            title="Save Signature"
            onPress={handleSave}
            disabled={isEmpty}
            icon={<Icon name="save" size={20} color={Colors.white} />}
            style={styles.saveButton}
          />
        </View>

        {/* Kenya eSignature Note */}
        <View style={styles.kenyaNote}>
          <Icon name="shield" size={16} color={Colors.info500} />
          <Text style={styles.kenyaNoteText}>
            Electronic signatures are legally binding in Kenya under the Kenya Information and Communications Act
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.lg,
  },
  description: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  signatureContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.borderMedium,
    borderStyle: 'dashed',
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    marginBottom: Layout.spacing.lg,
    position: 'relative',
  },
  signature: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  placeholderText: {
    marginTop: Layout.spacing.md,
    color: Colors.gray500,
    fontSize: Layout.fontSize.sm,
  },
  previewContainer: {
    marginBottom: Layout.spacing.lg,
  },
  previewTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  preview: {
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
  instructions: {
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  instructionText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    padding: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  clearButton: {
    flex: 1,
  },
  spacer: {
    width: Layout.spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.primaryBlue600,
  },
  kenyaNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.lg,
    backgroundColor: Colors.info50,
    borderTopWidth: 1,
    borderTopColor: Colors.info200,
  },
  kenyaNoteText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.info700,
    lineHeight: Layout.lineHeight.normal,
  },
});