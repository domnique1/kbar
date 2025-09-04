import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';

type Router = {
  replace: (path: string) => void;
  push: (path: string) => void;
};

export default function LoginScreen() {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter() as Router;

  const handleLogin = () => {
    // For now, skip validation and just navigate
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Login to K Bar</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#bbb"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#bbb"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/forgotpassword')}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/signup')}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#0a84ff',
    fontSize: 16,
  },
});