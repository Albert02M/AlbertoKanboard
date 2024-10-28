import React, { useState, useEffect } from 'react';
import { Button, Text, View, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from '@env';
import { MaterialCommunityIcons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();
const DEFAULT_AVATAR_URL = 'https://yt3.googleusercontent.com/vRF8BHREiJ3Y16AbMxEi_oEuoQlnNNqGpgULuZ6zrWSAi24HcxX3Vko42RN8ToctH-G0qlWd=s160-c-k-c0x00ffffff-no-rj'; 
const discovery = {
  authorizationEndpoint: 'https://discord.com/api/oauth2/authorize',
  tokenEndpoint: 'https://discord.com/api/oauth2/token',
};

export default function App() {
  const [user, setUser] = useState(null);

  const redirectUri = makeRedirectUri({
    scheme: 'discordauthapp',
    useProxy: true,
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: DISCORD_CLIENT_ID,
      scopes: ['identify'],
      redirectUri,
      usePKCE: true,
    },
    discovery
  );

  const exchangeCodeForToken = async (code, codeVerifier) => {
    try {
      const response = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });

      const data = await response.json();
      
      if (data.access_token) {
        await fetchUserInfo(data.access_token);
        await AsyncStorage.setItem('access_token', data.access_token);
      } else {
        console.error("Error al obtener token de acceso:", data);
      }
    } catch (error) {
      console.error("Error al intercambiar el código:", error);
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      const res = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: Bearer ${token},
        },
      });
      const data = await res.json();
      setUser(data);
      await AsyncStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const getStoredUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('access_token');

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    };
    getStoredUser();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code, request.codeVerifier);
    }
  }, [response]);

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.profileContainer}>
          {/* <Image source={{ uri: https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png }} style={styles.avatar} /> */}
          <Image
  source={{
    uri: user.avatar
      ? https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png
      : DEFAULT_AVATAR_URL,
  }}
  style={styles.avatar}
/>
          <Text style={styles.profileName}>{user.username}</Text>
          {/* <Text style={styles.profileEmail}>{user.email || 'Correo no disponible'}</Text> */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loginContainer}>
          <MaterialCommunityIcons name="account-circle" size={100} color="white" style={styles.icon} />
          <TouchableOpacity style={styles.loginButton} onPress={() => promptAsync()} disabled={!request}>
            <MaterialCommunityIcons name="discord" size={24} color="white" style={styles.icon} />
            <Text style={styles.loginButtonText}>Iniciar sesión con Discord</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    alignItems: 'center',
    backgroundColor: '#5865F2',
    padding: 40,
    borderRadius: 10,
    width: '80%',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7289DA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
    backgroundColor: '#5865F2',
    padding: 40,
    borderRadius: 10,
    width: '80%',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  profileName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#DCDCDC',
    fontSize: 16,
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginBottom: 20,
  },
});