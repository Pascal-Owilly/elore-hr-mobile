import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useContracts } from '@/lib/contexts/ContractContext';
import SignatureScreen from 'react-native-signature-canvas';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';

const { width, height } = Dimensions.get('window');

type SignatureMode = 'draw' | 'text';

export default function SignContractScreen() {
  const { id } = useLocalSearchParams();
  const { user, employee } = useAuth();
  const { selectedContract, loadContract, signContract } = useContracts();
  
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [signatureKey, setSignatureKey] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [isSignatureSaved, setIsSignatureSaved] = useState(false);
  const signatureRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const signatureHeight = useRef(new Animated.Value(180)).current; // For animation

  useEffect(() => {
    if (id) {
      loadContract(id as string);
    }
  }, [id]);

  // Animate signature pad collapse when saved
  useEffect(() => {
    if (isSignatureSaved) {
      Animated.timing(signatureHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(signatureHeight, {
        toValue: 180,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isSignatureSaved]);

  // Reset signature saved state when mode changes
  useEffect(() => {
    if (!signature) {
      setIsSignatureSaved(false);
    }
  }, [signature, mode]);

  // Handle canvas signature
  const handleCanvasSignature = (signatureData: string) => {
    console.log('Canvas signature captured - Data present:', !!signatureData);
    
    if (signatureData && signatureData.length > 100) {
      // Clean the signature data - remove data URL prefix if present
      let cleanSignature = signatureData;
      if (signatureData.startsWith('data:image/png;base64,')) {
        cleanSignature = signatureData.replace('data:image/png;base64,', '');
      }
      
      console.log('Setting signature, length:', cleanSignature.length);
      setSignature(cleanSignature);
      setHasDrawn(true);
      setIsSavingSignature(false);
      setIsSignatureSaved(true); // Mark as saved
    } else {
      console.log('Empty or invalid signature data received');
      setSignature(null);
      setIsSignatureSaved(false);
    }
  };

  const handleCanvasEmpty = () => {
    console.log('Canvas empty callback');
    setSignature(null);
    setHasDrawn(false);
    setIsSignatureSaved(false);
  };

  const handleCanvasClear = () => {
    console.log('Canvas cleared');
    setSignature(null);
    setHasDrawn(false);
    setIsSignatureSaved(false);
  };

  const handleCanvasEnd = () => {
    console.log('Canvas drawing ended, hasDrawn:', hasDrawn);
    // Auto-save after drawing ends
    if (hasDrawn && !signature) {
      setTimeout(() => {
        if (signatureRef.current) {
          console.log('Auto-saving signature...');
          setIsSavingSignature(true);
          signatureRef.current.readSignature();
        }
      }, 500);
    }
  };

  const handleClearCanvas = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    setSignature(null);
    setHasDrawn(false);
    setIsSignatureSaved(false);
    setSignatureKey(prev => prev + 1);
  };

  // Handle text signature
  const handleTextSignature = () => {
    if (!signatureText.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    
    // Create a simple signature - just the name in base64
    const signatureData = btoa(unescape(encodeURIComponent(`SIGNED: ${signatureText.trim()}`)));
    console.log('Text signature saved, length:', signatureData.length);
    setSignature(signatureData);
    setIsSignatureSaved(true);
    Alert.alert('Success', 'Text signature saved successfully');
  };

  const handleClearText = () => {
    setSignatureText('');
    setSignature(null);
    setIsSignatureSaved(false);
  };

  const handleClear = () => {
    if (mode === 'draw') {
      handleClearCanvas();
    } else {
      handleClearText();
    }
  };

  const handleSaveSignature = () => {
    if (mode === 'draw') {
      if (signatureRef.current) {
        console.log('Manually saving canvas signature...');
        setIsSavingSignature(true);
        signatureRef.current.readSignature();
      }
    } else {
      handleTextSignature();
    }
  };

  const handleConfirm = async () => {
    if (!signature) {
      Alert.alert('Error', 'Please save your signature first');
      return;
    }

    if (!isSignatureSaved) {
      Alert.alert('Error', 'Please save your signature first');
      return;
    }

    if (!agreed) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    try {
      setIsSigning(true);
      
      console.log('Submitting signature, length:', signature.length);
      
      await signContract(id as string, signature, 'employee');
      
      Alert.alert(
        'Success',
        'Contract signed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              router.replace(`/(app)/contracts/${id}`);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Signing error:', error);
      Alert.alert('Error', error.message || 'Failed to sign contract. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  // Canvas style with better touch handling
  const canvasStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: 1px solid #E5E7EB;
      background-color: #FFFFFF;
      width: 100%;
      height: 100%;
      touch-action: none;
      position: relative;
    }
    
    .m-signature-pad--body {
      border: none;
      width: 100%;
      height: 100%;
      touch-action: none;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    
    .m-signature-pad--body canvas {
      border-radius: 8px;
      width: 100% !important;
      height: 100% !important;
      touch-action: none;
    }
    
    .m-signature-pad--footer {
      display: none;
    }
    
    body, html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      touch-action: none;
      position: fixed;
    }
  `;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container}>
        {/* Header - Fixed at top */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color="#1E40AF" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Sign Contract</Text>
            <Text style={styles.subtitle}>Sign your employment contract</Text>
          </View>
        </View>

        {/* Scrollable content area (above signature pad) */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContent}
          contentContainerStyle={[
            styles.scrollContentContainer,
            isSignatureSaved && styles.scrollContentContainerExpanded
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="info" size={20} color="#3B82F6" />
                  <Text style={styles.infoText}>
                    Choose your preferred signature method below. Both are legally binding.
                  </Text>
                </View>
              </Card>

              {/* Contract Info */}
              {selectedContract && (
                <Card style={styles.contractInfo}>
                  <Text style={styles.contractTitle}>{selectedContract.title}</Text>
                  <Text style={styles.contractNumber}>
                    Contract Number: {selectedContract.contract_number}
                  </Text>
                  <Text style={styles.contractDate}>
                    Date: {new Date().toLocaleDateString()}
                  </Text>
                </Card>
              )}

              {/* Signature Mode Selector */}
              <Card style={styles.modeSelectorCard}>
                <Text style={styles.modeSelectorTitle}>Signature Type</Text>
                <View style={styles.modeButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.modeButton,
                      mode === 'draw' && styles.modeButtonActive
                    ]}
                    onPress={() => setMode('draw')}
                    disabled={!!signature}
                  >
                    <Icon 
                      name="edit" 
                      size={20} 
                      color={mode === 'draw' ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.modeButtonText,
                      mode === 'draw' && styles.modeButtonTextActive
                    ]}>
                      Draw Signature
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modeButton,
                      mode === 'text' && styles.modeButtonActive
                    ]}
                    onPress={() => {
                      setMode('text');
                      Keyboard.dismiss();
                    }}
                    disabled={!!signature}
                  >
                    <Icon 
                      name="text-fields" 
                      size={20} 
                      color={mode === 'text' ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.modeButtonText,
                      mode === 'text' && styles.modeButtonTextActive
                    ]}>
                      Text Signature
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>

              {/* Preview area - Only show when signature is saved */}
              {signature && isSignatureSaved && (
                <Card style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Icon name="check-circle" size={24} color="#059669" />
                    <Text style={styles.previewTitle}>Signature Saved</Text>
                  </View>
                  
                  <View style={styles.previewContent}>
                    <View style={styles.previewSignature}>
                      {mode === 'text' ? (
                        <View style={styles.textSignaturePreview}>
                          <Text style={styles.textSignaturePreviewName}>
                            {signatureText}
                          </Text>
                          <Text style={styles.textSignaturePreviewLabel}>
                            Text Signature
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.drawnSignaturePreview}>
                          <View style={styles.signatureImagePlaceholder}>
                            <Icon name="draw" size={32} color="#1E40AF" />
                            <Text style={styles.drawnSignatureText}>
                              Drawn Signature
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.previewInfo}>
                      <View style={styles.previewInfoRow}>
                        <Icon name="calendar-today" size={16} color="#6B7280" />
                        <Text style={styles.previewInfoText}>
                          {new Date().toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.previewInfoRow}>
                        <Icon name="schedule" size={16} color="#6B7280" />
                        <Text style={styles.previewInfoText}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              )}

              {/* Terms - Scrollable content ends here */}
              <Card style={styles.termsCard}>
                <Text style={styles.termsTitle}>Terms & Conditions</Text>
                <Text style={styles.termsText}>
                  By signing this contract, you agree to all terms and conditions outlined in the employment contract. 
                  Your signature indicates your acceptance of the job offer, compensation package, and all associated 
                  responsibilities.
                </Text>
                
                <TouchableOpacity 
                  style={styles.termsCheck}
                  onPress={() => setAgreed(!agreed)}
                  disabled={isSigning}
                >
                  <Icon 
                    name={agreed ? "check-circle" : "radio-button-unchecked"} 
                    size={20} 
                    color={agreed ? "#059669" : "#6B7280"} 
                  />
                  <Text style={styles.termsCheckText}>
                    I have read and agree to the terms of this employment contract
                  </Text>
                </TouchableOpacity>
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {/* FIXED SIGNATURE AREA - Collapses when signature is saved */}
        <View style={[
          styles.fixedSignatureArea,
          isSignatureSaved && styles.fixedSignatureAreaCollapsed
        ]}>
          {!isSignatureSaved ? (
            mode === 'draw' ? (
              <Card style={styles.signatureCard}>
                <View style={styles.signatureHeader}>
                  <Text style={styles.signatureTitle}>Draw Your Signature</Text>
                  {hasDrawn && (
                    <TouchableOpacity 
                      style={styles.saveHintButton}
                      onPress={handleSaveSignature}
                      disabled={isSavingSignature}
                    >
                      {isSavingSignature ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveHintText}>Save Now</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.canvasContainer}>
                  {isLoadingCanvas && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#1E40AF" />
                      <Text style={styles.loadingText}>Loading drawing pad...</Text>
                    </View>
                  )}
                  
                  <Animated.View style={[styles.canvasWrapper, { height: signatureHeight }]}>
                    <SignatureScreen
                      key={`signature-${signatureKey}`}
                      ref={signatureRef}
                      onOK={handleCanvasSignature}
                      onEmpty={handleCanvasEmpty}
                      onClear={handleCanvasClear}
                      onEnd={handleCanvasEnd}
                      onBegin={() => {
                        console.log('Drawing began');
                        setHasDrawn(true);
                      }}
                      webStyle={canvasStyle}
                      autoClear={false}
                      descriptionText="Draw here..."
                      clearText=""
                      confirmText=""
                      backgroundColor="#FFFFFF"
                      penColor="#000000"
                      imageType="image/png"
                      style={styles.canvas}
                      onLoadEnd={() => {
                        console.log('Canvas loaded');
                        setIsLoadingCanvas(false);
                      }}
                      onLoadError={(error) => {
                        console.error('Canvas load error:', error);
                        setIsLoadingCanvas(false);
                        Alert.alert(
                          'Drawing Pad Error',
                          'Unable to load drawing pad. Please use text signature instead.',
                          [{ text: 'Switch to Text', onPress: () => setMode('text') }]
                        );
                      }}
                    />
                  </Animated.View>
                  
                  <Text style={styles.canvasHint}>
                    Draw your signature in the box above {hasDrawn && '• Tap "Save Now" when done'}
                  </Text>
                </View>

                <View style={styles.signatureButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.saveButton, 
                      (!hasDrawn || isSavingSignature) && styles.saveButtonDisabled
                    ]}
                    onPress={handleSaveSignature}
                    disabled={!hasDrawn || isSavingSignature}
                  >
                    {isSavingSignature ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.saveButtonText}>Saving...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="save" size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>
                          {hasDrawn ? 'Save Signature' : 'Draw First'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <Card style={styles.signatureCard}>
                <Text style={styles.signatureTitle}>Enter Your Signature</Text>
                
                <View style={styles.textSignatureContainer}>
                  <Text style={styles.textSignatureLabel}>Enter your full legal name:</Text>
                  <TextInput
                    style={styles.textSignatureInput}
                    placeholder="John Doe"
                    value={signatureText}
                    onChangeText={setSignatureText}
                    autoCapitalize="words"
                    editable={!isSigning}
                    autoFocus={true}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  
                  <Text style={styles.textSignatureHint}>
                    By entering your name, you agree this constitutes your legal signature
                  </Text>
                </View>

                <View style={styles.signatureButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.saveButton, 
                      (!signatureText || isSigning) && styles.saveButtonDisabled
                    ]}
                    onPress={handleSaveSignature}
                    disabled={!signatureText || isSigning}
                  >
                    <Icon name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Text Signature</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )
          ) : (
            // Show saved signature summary in collapsed view
            <Card style={styles.savedSignatureCard}>
              <View style={styles.savedSignatureHeader}>
                <View style={styles.savedSignatureStatus}>
                  <Icon name="check-circle" size={20} color="#059669" />
                  <Text style={styles.savedSignatureStatusText}>
                    Signature Saved
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleClear}
                  disabled={isSigning}
                >
                  <Icon name="edit" size={16} color="#1E40AF" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.savedSignaturePreview}>
                {mode === 'text' ? (
                  <Text style={styles.savedSignatureText}>
                    {signatureText}
                  </Text>
                ) : (
                  <View style={styles.savedSignatureIcon}>
                    <Icon name="draw" size={24} color="#1E40AF" />
                    <Text style={styles.savedSignatureIconText}>
                      Drawn Signature
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Final Action Buttons - Always visible */}
          <View style={styles.finalActionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isSigning}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                (!isSignatureSaved || !agreed || isSigning) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={isSigning || !isSignatureSaved || !agreed}
            >
              {isSigning ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmButtonText}>Signing...</Text>
                </>
              ) : (
                <>
                  <Icon name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>
                    {isSignatureSaved && agreed ? 'Confirm Signature' : 'Complete Requirements'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 100,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 320, // Extra padding for fixed signature area
  },
  scrollContentContainerExpanded: {
    paddingBottom: 200, // Less padding when signature is saved (signature area is collapsed)
  },
  infoCard: {
    marginBottom: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contractInfo: {
    marginBottom: 16,
    padding: 16,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  contractDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  modeSelectorCard: {
    marginBottom: 16,
    padding: 16,
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#1E40AF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  previewCard: {
    marginBottom: 16,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  previewContent: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
  },
  previewSignature: {
    alignItems: 'center',
    marginBottom: 12,
  },
  textSignaturePreview: {
    alignItems: 'center',
  },
  textSignaturePreviewName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  textSignaturePreviewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  drawnSignaturePreview: {
    alignItems: 'center',
  },
  signatureImagePlaceholder: {
    alignItems: 'center',
    padding: 16,
  },
  drawnSignatureText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '500',
    marginTop: 8,
  },
  previewInfo: {
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
    paddingTop: 12,
  },
  previewInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  termsCard: {
    marginBottom: 16,
    padding: 16,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  termsCheck: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 6,
  },
  termsCheckText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  // FIXED SIGNATURE AREA - Collapses when signature is saved
  fixedSignatureArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    maxHeight: height * 0.6,
  },
  fixedSignatureAreaCollapsed: {
    maxHeight: 180, // Much smaller when signature is saved
  },
  signatureCard: {
    marginBottom: 16,
  },
  savedSignatureCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedSignatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedSignatureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedSignatureStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
  savedSignaturePreview: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  savedSignatureText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontStyle: 'italic',
  },
  savedSignatureIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedSignatureIconText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '500',
  },
  signatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  saveHintButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  saveHintText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  canvasContainer: {
    marginBottom: 12,
  },
  canvasWrapper: {
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  canvasHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  textSignatureContainer: {
    marginBottom: 16,
  },
  textSignatureLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  textSignatureInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  textSignatureHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  signatureButtons: {
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
  finalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});