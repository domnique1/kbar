import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = () => {
    // For now, skip validation and just navigate
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Image
              source={require('../assets/images/logo3.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your K Bar experience</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons 
                name="phone" 
                size={20} 
                color="#666" 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons 
                name="lock" 
                size={20} 
                color="#666" 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.visibilityToggle}
              >
                <MaterialCommunityIcons 
                  name={isPasswordVisible ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
              <LinearGradient
                colors={['#00ADEF', '#2b5876']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.loginButtonText}>Login</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Links Section */}
            <View style={styles.linksContainer}>
              <TouchableOpacity
                onPress={() => router.push('/forgotpassword')}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => router.push('/signup')}
                style={styles.signupButton}
              >
                <Text style={styles.signupText}>
                  Don't have an account? <Text style={styles.signupHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFFEFF', // Light background color matching your menu screen
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: '#1a1a1a',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#1a1a1a',
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  visibilityToggle: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#00ADEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  linksContainer: {
    alignItems: 'center',
  },
  linkButton: {
    marginBottom: 24,
  },
  linkText: {
    color: '#00ADEF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  signupButton: {
    width: '100%',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  signupHighlight: {
    color: '#00ADEF',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    color: '#00ADEF',
    fontWeight: '500',
  },
});