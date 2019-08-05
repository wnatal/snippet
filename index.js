import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

import React, { Component } from 'react'
import { Dimensions, View, StyleSheet, Text} from 'react-native'
import Button from '../../Components/Button'
import { withRouter, Redirect, Link } from 'react-router-dom'
import {ScrollSyncPane, ScrollSync} from 'react-scroll-sync'
import { observer } from 'mobx-react'
import debounce from 'lodash/debounce'

import Wrapper from '../../Components/Wrapper'

import { alba, auth, home, operation } from '../../Model'
import Header from "../../Components/Header";
import Colors from "../../Themes/Colors";
import TitleBar from "../../Components/TitleBar";
import SelectAndEdit from "../../Components/SelectAndEdit";
import Select from "../../Components/Select";

import ReactResizeDetector from 'react-resize-detector';

const Realusers = ["john", "bob"]
const RealmailAddresses = ["john@dive.ai", "bob@dive.ai"]
const Realcompanies = ["deepdive", "diver"]
const Realdata = [[false,false,false,false,false,false,false,false,false,false,false],
  [true,false,true,false,false,false,false,false,false,false,false]]
@observer
class Administrator extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      screen: {
        w: 0,
        h: 0
      },
      users: [...Realusers],
      mailAddresses: [...RealmailAddresses],
      companies: [...Realcompanies],
      data: JSON.parse(JSON.stringify(Realdata)),
      markI: -1,
      markJ: -1,
      chosenTopic: '-',
      chosenUser: '-',
      selected: '-',
      tableUserWidth: 400,
      headerHeight: 30,
      menuHeight: 60,
      chosenCompany: '-',
      chosenMail: '-'
    }
  }

  logout = () => {
    auth.logout()
    this.props.history.push('/')
  }

  updateDimensions = () => {
    const { height, width } = Dimensions.get('window')
    this.setState({ screen: { w: width, h: height } })
  }

  componentWillMount = () => {
    this.updateDimensions()
  }

  componentDidMount = () => {

    this.resetHomeVars()
    operation.getData().then((isAuth) => {
      if (isAuth) {
        if (operation.startOn === 'inbox') this.setState({ isInbox: true })
        else {
          alba.getData()
          window.addEventListener('resize', debounce(this.updateDimensions, 300))
        }
      } else {
        this.logout()
      }
      this.setState({ loading: false })
    })
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.updateDimensions)
  }

  resetHomeVars = () => {
    home.searched = false
    home.reset()
  }
  loadData = () => {
    this.setState({users: [...Realusers], data: JSON.parse(JSON.stringify(Realdata)), mailAddresses: [...RealmailAddresses], companies: [...Realcompanies]})
  }
  changeEntry = (i, j) => {
    const data = this.state.data
    data[i][j]=!data[i][j]
    this.setState({data: data, selected: this.translate(data[i][j])})
  }

  deleteUser = (i) => {
    const data = this.state.data
    data.splice(i, 1)
    const users = this.state.users
    users.splice(i, 1)
    const mailAddresses = this.state.mailAddresses
    mailAddresses.splice(i, 1)
    const companies = this.state.companies
    companies.splice(i, 1)


    this.setState({users: users, data: data, mailAddresses: mailAddresses, companies: companies})

  }
  discard = () => {
    this.loadData()
  }
  save = () => {

    const len = Realusers.length
    Realusers.splice(0,len, ...this.state.users)
    RealmailAddresses.splice(0,len, ...this.state.mailAddresses)
    Realcompanies.splice(0,len, ...this.state.companies)
    Realdata.splice(0,len)
    //Realdata is a constant, so no direct assignment
    this.state.data.map((data)=>{
      Realdata.push([...data])
    })

  }

  onResize = (w, h) =>{
    this.setState({tableUserWidth: w})
  }
  onResizeCell = (w, h) =>{
    this.setState({headerHeight: h})
  }
  onResizeMenuBar = (w, h) =>{
    this.setState({menuHeight: h})
  }

  newUser = () => {

    const data = this.state.data
    const users = this.state.users
    const mailAddresses = this.state.mailAddresses
    const companies = this.state.companies
    const name = prompt("", "name")
    const mail = prompt("", "mail")

    if(name){
      if(mailAddresses.includes(mail)){
        alert("user exists already")
      }
      else {
        const company = prompt("", "company")
        users.push(name)
        mailAddresses.push(mail)
        companies.push(company)

        data.push(new Array(operation.topics.length).fill(false))

        this.setState({ users: users, mailAddresses: mailAddresses, companies: companies, data: data })
      }
    }



  }

  renderLine = () => {
    return (
      this.state.data.map((data, i)=>{
        return(
          <tr>
            {data.map((topic, j) => {
              const cellStyle = this.state.markI === i
                ?(this.state.markJ === j?cellXHL:cellHL)
                :(this.state.markJ === j?cellHL:cell)
              const checkboxStyle = this.state.markI === i && this.state.markJ === j
                ? styles.checkboxHL
                : styles.checkbox

              return(
                <td style={cellStyle}
                    onMouseEnter={this.mark.bind(this, i,j)}
                    title={operation.topics[j]}
                >
                  <View style={[topic?{backgroundColor:Colors.green}:{backgroundColor:Colors.pink}, checkboxStyle]}
                        onClick={this.changeEntry.bind(this, i, j)}
                  />
                </td>
              )
            })}
          </tr>
        )
      })
    )
  }

  mark = (i,j) => {
    if(j!== 0 && !j){
      j=this.state.markJ
    }
    this.setState({

      markI: i, markJ: j,
      chosenTopic: operation.topics[j],
      chosenUser: this.state.users[i],
      chosenMail: this.state.mailAddresses[i],
      chosenCompany: this.state.companies[i],
      selected: this.translate(this.state.data[i][j])
    })
  }

  translate = (val) => {
    if(val === 'enabled')
      return true
    if(val === 'disabled')
      return false
    if(val)
      return 'enabled'
    return 'disabled'
  }

  renderUsers = () => {
    return (
      this.state.users.map((user, i)=>{

        const cellStyle = this.state.markI === i
          ?cellHL:cell
        return(
          <tr className='table-line'>
            <td style={cellStyle} onMouseEnter={this.mark.bind(this, i,0)}>
              <Button background={Colors.purple} title="Delete" onPress={this.deleteUser.bind(this, i)}/>
            </td>
            <td style={cellStyle} onMouseEnter={this.mark.bind(this, i,0)}>
              {user}
            </td>
            <td style={cellStyle} onMouseEnter={this.mark.bind(this, i,0)}>
              {this.state.mailAddresses[i]}
            </td>
            <td style={cellStyle} onMouseEnter={this.mark.bind(this, i,0)}>
              {this.state.companies[i]}
            </td>

          </tr>
        )

      })

    )
  }


  render () {
    if (!auth.loggedIn()) {
      return <Redirect to={{ pathname: '/' }}/>
    }

    const thFirst = {
      top: 60 + this.state.menuHeight,
      position: "sticky",
      zIndex: 1,
      borderRight: '1px solid #dddddd',
      borderBottom: '1px solid #dddddd',
      paddingHorizontal: '10px',
      maxWidth: 120,
      width: "fit-content",
      minWidth: 60,
      backgroundColor: 'white',
      height: this.state.headerHeight - 3,

    }
    const menuBar = {
      position: 'sticky',
      zIndex: 1,
      top: 60,
      backgroundColor: 'white',
      display: 'flex',
      flexWrap: 'wrap',
      width: this.state.screen.w - 25,
      maxWidth: 900,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
    const widthTable = "calc(100% - "+this.state.tableUserWidth+"px - 0px)"

    return (
      <View>
        <Wrapper>
          <Header
            screen={this.state.screen}
            onLogout={this.logout}
            onChangeTopic={this.reloadTabs}
            admin
          />
          <View style={[styles.container,
            { minWidth: this.state.tableUserWidth + 200}]}>
            <TitleBar text = "Admin-Panel" boxStyle={{marginHorizontal: -25, marginBottom: 40}}/>


            <View style={menuBar}>

              <ReactResizeDetector handleWidth handleHeight onResize={this.onResizeMenuBar}/>
              <View style={{width: 150, display: 'flex'}}>
                <Text style={styles.labelBold}>{'user'}</Text>
                <SelectAndEdit
                  value={this.state.chosenMail}
                  valueIndex={this.state.mailAddresses}
                  options={this.state.users}
                  onChange={(event) => this.mark(this.state.mailAddresses.indexOf(event.target.value))}
                />
              </View>
              <View style={{width: 150, display: 'flex'}}>
                <Text style={styles.labelBold}>{'mail'}</Text>
                <SelectAndEdit
                  value={this.state.chosenMail}
                  options={this.state.mailAddresses}
                  onChange={(event) => this.mark(this.state.mailAddresses.indexOf(event.target.value))}
                />
              </View>
              <View style={{width: 150, display: 'flex'}}>
                <Text style={styles.labelBold}>{'account'}</Text>
                <SelectAndEdit
                  value={this.state.chosenMail}
                  valueIndex={this.state.mailAddresses}
                  options={this.state.companies}
                  onChange={(event) => this.mark(this.state.mailAddresses.indexOf(event.target.value))}
                />
              </View>


              <View style={{display: 'flex', marginBottom: 16}}>
                <Button background={Colors.purple} title="Delete"
                        disabled={this.state.markI < 0}
                        onPress={this.deleteUser.bind(this, this.state.markI)}
                />
              </View>

              <View style={{width: 150, display: 'flex'}}>
                <Text style={styles.labelBold}>{'topic'}</Text>
                <Select
                  value={this.state.chosenTopic}
                  options={operation.topics}
                  onChange={(event) => (this.setState({
                    chosenTopic: event.target.value,
                    markJ: operation.topics.indexOf(event.target.value)}))}
                />
              </View>

              <View style={{width: 150, display: 'flex'}}>
                <Text style={styles.labelBold}>{'access-right'}</Text>
                <Select
                  value={this.state.selected}
                  options={['disabled', 'enabled']}
                  onChange={(event) => {
                    const data = this.state.data
                    data[this.state.markI][this.state.markJ]=event.target.value==='enabled'
                    this.setState({data: data, selected: event.target.value})
                  }}
                />
              </View>
            </View>


            <View style={{display: 'flex', position: 'relative', flexDirection: 'row', alignItems: 'flex-end',}}>
              <table style={tableStyle}>
                <ReactResizeDetector handleWidth handleHeight onResize={this.onResize}/>
                <thead>
                <tr>
                  <th style={thFirst}></th>
                  <th style={thFirst}>user</th>
                  <th style={thFirst}>email</th>
                  <th style={thFirst}>account</th>
                </tr>
                </thead>
                <tbody>
                {this.renderUsers()}
                </tbody>
              </table>
              <ScrollSync>
                <View style={{width: widthTable}}>
                  <ScrollSyncPane>
                    <View style={{position: 'sticky', zIndex: 1, backgroundColor: 'white',
                      top: 60 + this.state.menuHeight, width: '100%', overflow: "scroll"}}
                    >
                      <table style={tableStyle}>
                        <thead>
                        <tr>
                          {operation.topics.map((topic, j)=>{
                            const size = j==0
                              ?<ReactResizeDetector handleWidth handleHeight onResize={this.onResizeCell}/>
                              :null
                            const cellStyle = this.state.markJ === j ?thHL :th
                            return(<th style={cellStyle} onMouseEnter={this.mark.bind(this, 0 ,j)}>{size}{topic}</th>)
                          })}
                        </tr>
                        </thead>
                      </table>
                    </View>
                  </ScrollSyncPane>
                  <ScrollSyncPane>
                    <View style={{position: 'relative', width: '100%', overflow: "auto"}}>
                      <table style={tableStyle}>
                        <thead>
                        <tr>
                          {operation.topics.map((topic, j)=>{
                            return(
                              <th style={thHidden} onMouseEnter={this.mark.bind(this, 0 ,j)}>
                                <div style={{height: 0}}>{topic}</div>
                              </th>
                            )
                          })}
                        </tr>
                        </thead>
                        <tbody>
                        {this.renderLine()}
                        </tbody>
                      </table>
                    </View>
                  </ScrollSyncPane>



                </View>
              </ScrollSync>
            </View>




            <View style={styles.buttonContainer}>
              <Button background={Colors.purple} upper
                      style={styles.button}
                      onPress={this.newUser.bind(this)} title="+"
              />
              <Button background={Colors.yellow} upper
                      style={styles.button}
                      onPress={this.save.bind(this)}
                      title="save changes"
              />
              <Button background={Colors.purple} upper
                      style={styles.button}
                      onPress={this.discard.bind(this)} title="discard"
              />
            </View>
          </View>

        </Wrapper>

      </View>
    )
  }
}


const th = {

  borderRight: '1px solid #dddddd',
  borderBottom: '1px solid #dddddd',
  paddingHorizontal: '10px',
  maxWidth: 120,
  width: "fit-content",
  minWidth: 80,
  zIndex: 1,
  top: 0,
  backgroundColor: Colors.white,

}

const thHL = {

  borderRight: '1px solid #dddddd',
  borderBottom: '1px solid #dddddd',
  paddingHorizontal: '10px',
  backgroundColor: Colors.purpleExtraTrans,
  maxWidth: 120,
  width: "fit-content",
  minWidth: 80,

}

const thHidden = {

  borderRight: '1px solid #dddddd',
  paddingHorizontal: '10px',
  maxWidth: 120,
  width: "fit-content",
  minWidth: 80,
  overflow: 'hidden',
  paddingTop: 0,
  paddingBottom: 0,

}
const cell = {
  borderRight: '1px solid #dddddd',
  padding: '10px',
  maxWidth: 120,
  width: "fit-content",
  minWidth: 60,
  height: 34
}
const cellHL = {
  borderRight: '1px solid #dddddd',
  backgroundColor: Colors.purpleExtraTrans,
  padding: '10px',
  maxWidth: 120,
  width: "fit-content",
  minWidth: 60,
  height: 34
}
const cellXHL = {
  borderRight: '1px solid #dddddd',
  backgroundColor: Colors.purpleTrans,
  padding: '10px',
  width: "fit-content",
  minWidth: 60,
  maxWidth: 120,
}
const tableStyle = {
  position: 'relative',
  tableLayout: 'auto',
  width: 'fit-content',
  borderCollapse: 'separate',
  borderSpacing: 0,
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 60,
  },

  buttonContainer: {
    paddingTop: 20,
    flexDirection: 'row'
  },
  button:{
    marginRight: 10
  },
  checkbox:{
    margin: 'auto',
    borderRadius: 10,
    width: 20,
    height: 20
  },
  checkboxHL:{
    cursor: 'pointer',
    margin: 'auto',
    borderRadius: 15,
    height: 30,
    width: 30,
    border: "3px solid white"
  },




})


export default withRouter(Administrator)