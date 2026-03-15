import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text, Dimensions } from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { loginUser } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { COLORS } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginUser(username, password);
      if(data.success) {
         navigation.replace('Dashboard');
      } else {
         setError('Login failed.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: COLORS.bgLight }]}
    >
      <View style={[styles.card, { backgroundColor: COLORS.white, shadowColor: COLORS.primary }]}>
        {/* Branding Header */}
        <View style={styles.headerContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}1A` }]}>
            <MaterialIcons name="task-alt" size={48} color={COLORS.primary} />
          </View>
          <Text style={[styles.title, { color: COLORS.slate900 }]}>TaskMaster</Text>
          <Text style={[styles.subtitle, { color: COLORS.slate500 }]}>Efficiency, simplified.</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, { color: COLORS.slate900 }]}>Welcome Back</Text>
          <Text style={[styles.welcomeSubtitle, { color: COLORS.slate500 }]}>Log in to manage your workspace</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: COLORS.slate700 }]}>User ID</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person" size={20} color={COLORS.slate400} style={styles.inputIconLeft} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={[styles.input, { borderColor: COLORS.slate200, backgroundColor: COLORS.white }]}
                placeholder="Enter your ID"
                placeholderTextColor={COLORS.slate400}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor={COLORS.primary}
                theme={{ colors: { primary: COLORS.primary, background: COLORS.white, text: COLORS.slate900 } }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: COLORS.slate700 }]}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color={COLORS.slate400} style={styles.inputIconLeft} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.input, { paddingRight: 40, borderColor: COLORS.slate200, backgroundColor: COLORS.white }]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.slate400}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor={COLORS.primary}
                theme={{ colors: { primary: COLORS.primary, background: COLORS.white, text: COLORS.slate900 } }}
              />
              <TouchableOpacity style={styles.inputIconRight} onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={COLORS.slate400} />
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: COLORS.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: COLORS.primary, shadowColor: COLORS.primary }, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={[styles.loginButtonText, { color: COLORS.white }]}>Sign In</Text>
                <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Background decoration */}
      <View style={[styles.bgBlobRight, { backgroundColor: `${COLORS.primary}0D` }]} />
      <View style={[styles.bgBlobLeft, { backgroundColor: `${COLORS.primary}1A` }]} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  iconContainer: {
    padding: 16,
    borderRadius: 999,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  welcomeContainer: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  formContainer: {
    padding: 32,
    gap: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    height: 56,
    justifyContent: 'center',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 44,
    fontSize: 16,
    height: 56,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: -10,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginTop: -10,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bgBlobRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    zIndex: 0,
  },
  bgBlobLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    zIndex: 0,
  }
});
