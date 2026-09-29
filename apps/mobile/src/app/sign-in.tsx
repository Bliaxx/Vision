import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Monogram } from '@/components/brand/monogram';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth';
import { useTheme } from '@/theme/theme';

export default function SignInScreen() {
  const t = useTranslations('auth');
  const { colors, fonts, radii } = useTheme();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({ email: email.trim(), password });
    setPending(false);
    if (result.error) {
      setError(t('invalidCredentials'));
      return;
    }
    await queryClient.invalidateQueries();
    router.back();
  };

  const input = {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.uiRegular,
    fontSize: 16,
    color: colors.text,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ padding: 24, gap: 18 }}>
        <Monogram size={44} />
        <View style={{ gap: 6 }}>
          <Text variant="display">{t('signInTitle')}</Text>
          <Text tone="muted">{t('signInSubtitle')}</Text>
        </View>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('email')}
          accessibilityLabel={t('email')}
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('password')}
          accessibilityLabel={t('password')}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void submit()}
          style={input}
        />
        {error ? (
          <Text tone="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <Button
          label={t('submitSignIn')}
          size="lg"
          loading={pending}
          disabled={!email || !password}
          onPress={() => void submit()}
        />
        <Text variant="caption" tone="subtle">
          {t('demoHint')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
