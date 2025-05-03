import {useState} from 'react';
import { Text, SafeAreaView, TextInput, Button, StyleSheet, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [nome, setNome] = useState('');
  const [msg, setMsg] = useState('Digite o seu nome e clique em atualizar!');
  const [image, setImage] = useState(null);

  function atualizaTexto() {
    if (nome != '') {
      setMsg('Olá ' + nome + ', bem-vindo a aula de react-native!');
    }
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <View style = {styles.fundo}>
      <View style={styles.botao}>
        <Button title={'Selecionar foto'} onPress={pickImage} />
        </View>
        <View style={styles.botao}>
        <Button title={'Tirar foto'} onPress={takePicture} />
        </View>
        {/* Operador ternario */}
        {image ? (
          <Image style={styles.foto} source={{ uri: image }} />
        ) : (
          <Image style={styles.foto} source={require('./assets/snack-icon.png')} />
        )}

        <Text style={styles.nome2}>Insira o seu nome abaixo:</Text>
        <TextInput
          style={styles.nome}
          placeholder='Seu nome'
          onChangeText={(valor) => setNome(valor)}
        />
        <Text style={styles.nome2}>Insira o seu email abaixo:</Text>
        <TextInput
          style={styles.nome}
          placeholder='Seu nome'
          onChangeText={(valor) => setNome(valor)}
        />      
        <Text style={styles.nome2}>Insira a sua idade abaixo:</Text>
        <TextInput
          style={styles.nome}
          placeholder='Seu nome'
          onChangeText={(valor) => setNome(valor)}
        />      
        <Text style={styles.nome2}>Insira a sua cidade abaixo:</Text>
        <TextInput
          style={styles.nome}
          placeholder='Seu nome'
          onChangeText={(valor) => setNome(valor)}
        />

        <View style={styles.botao}>
          <Button title={'Atualizar'} onPress={atualizaTexto} />
        </View>
        <View style={styles.msg}>
          <Text style={styles.texto}>{msg}</Text>
        </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  nome: {
    borderWidth: 1,
    marginBottom: 10,
    marginHorizontal: '10%',
    borderRadius: 20,
    padding: 5,
  },
  texto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  foto: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 10,
  },
  nome2:{
    alignSelf:'center',
    fontWeight:'bold',
    fontSize: 20,
  },
  botao:{
    marginHorizontal: 40,
    marginBottom: 10,
  },
  msg:{
    backgroundColor: 'red',
    padding: 10,
    marginHorizontal:50,
    marginTop:10,
    borderRadius:10
  },
  fundo:{
    backgroundColor: 'white',
    paddingVertical: 50,
    borderRadius: 10,
    marginHorizontal: 15
  }
});
