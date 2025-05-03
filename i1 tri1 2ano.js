import {View, ScrollView, Text, StyleSheet, Image, Button, TextInput} from 'react-native';

export default function App() {
  return (
    <View style={styles.fundo}>
      <Image style={styles.logo} source ={require('/loja_icone.png')}/>
      <View style={styles.formulario}>
        <Text style={styles.cadastro}>
          Cadastro
        </Text>
        <TextInput style={styles.texto} placeholder ='Nome:'/>
        <TextInput style={styles.texto} placeholder ='E-mail:'/>
        <TextInput style={styles.texto} placeholder ='Senha:' keyboardType = 'password'secureTextEntry = {true}/>
        <TextInput style={styles.texto} placeholder ='Confirmar Senha:' secureTextEntry = {true}/>
        <View style={styles.botao}>
          <Button title='Cadastrar' color='red'/>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  fundo: {
    backgroundColor: 'red'
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 50,
  },
  botao: {
    borderWidth: 1,
    borderColor: 'black',
    color: 'red',
  },
  formulario :{
    backgroundColor: 'white',
    borderRadius: '4%',
    paddingBottom: 40,
    marginBottom: '100%'
  },
  cadastro :{
    textAlign: 'center',
    fontWeight: 'bolder',
    fontSize: 36
  },
  texto :{
    marginVertical: 20,
    fontWeight: 'bolder',
    borderBottomWidth: 1,
    fontSize: 18
  },
})
