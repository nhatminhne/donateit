import Head from "next/head";
import { useState, useEffect } from "react";
import { useWallet } from "use-wallet";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useWindowSize } from "react-use";
import {
  getETHPrice,
  getETHPriceInUSD,
  getWEIPriceInUSD,
} from "../../lib/getETHPrice";
import { 
  Box,
  Flex,
  Stack,
  Heading,
  Text,
  Container,
  Input,
  Button,
  SimpleGrid,
  InputRightAddon,
  InputGroup,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Tooltip,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  CloseButton,
  FormHelperText,
  Link,
} from "@chakra-ui/react";

import { InfoIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import Confetti from "react-confetti";
import loadBlockchainData from "../../src/factory";
import filterWithdrawal, { approveCount } from "../../src/filterWithdrawal";
import Web3 from "web3";

function StatsCard(props) {
  const { title, stat, info } = props;
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={"5"}
      shadow={"sm"}
      border={"1px solid"}
      borderColor={"gray.500"}
      rounded={"lg"}
      transition={"transform 0.3s ease"}
      _hover={{
        transform: "translateY(-5px)",
      }}
    >
      <Tooltip
        label={info}
        bg={useColorModeValue("white", "gray.700")}
        placement={"top"}
        color={useColorModeValue("gray.800", "white")}
        fontSize={"1em"}
      >
        <Flex justifyContent={"space-between"}>
          <Box pl={{ base: 2, md: 4 }}>
            <StatLabel fontWeight={"medium"} isTruncated>
              {title}
            </StatLabel>
            <StatNumber
              fontSize={"base"}
              fontWeight={"bold"}
              isTruncated
              maxW={{ base: "	10rem", sm: "sm" }}
            >
              {stat}
            </StatNumber>
          </Box>
        </Flex>
      </Tooltip>
    </Stat>
  );
}

export default function CampaignSingle({
  
}) {
  const { handleSubmit, register, formState, reset, getValues } = useForm({
    mode: "onChange",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [amountInUSD, setAmountInUSD] = useState();
  const wallet = useWallet();
  const router = useRouter();
  const campaignId = router.query.id;
  const { width, height } = useWindowSize();
  const [charityContract, setCharityContract] = useState([]);
  const [campaign, setCampaign] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [countApprover, setCountApprover] = useState(0);
  const [ETHPrice, updateEthPrice] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    campaignId && getContract(getCampaign)
  }, [campaignId])

  async function getContract(callback) {
    const contractCharity = await loadBlockchainData()
    setCharityContract(contractCharity)
    callback(contractCharity)
  }

  async function getCampaign(contractCharity) {
    const ETHPrice = await getETHPrice();
    updateEthPrice(ETHPrice);

    try{
      const tmpCampaign = await contractCharity.methods.campaigns(campaignId).call();
      setCampaign(tmpCampaign)
      setIsDone(false)

      if(parseInt(tmpCampaign.total) > parseInt(tmpCampaign.target)) {
        setIsDone(true)
      }
    }catch{
      setCampaign({})
    }
   
    const tmpWithdrawals = await filterWithdrawal(campaignId)
    setWithdrawals(tmpWithdrawals || [])
    const tmpCountApprover = approveCount(withdrawals)
    setCountApprover(tmpCountApprover)    
  }
  //console.log("id: ",campaign)

  async function onSubmit(data) {
    console.log(data);
    try {
      //const accounts = await web3.eth.getAccounts();

      await charityContract.methods.donateCampaign("0x2BC282e18104E50C0D3d7d432F027da30d38184C", campaignId).send({
        from: wallet.account,
        value: Web3.utils.toWei(data.value, "ether"),
      });

      //router.push(`/campaign/${campaignId}`);
      setAmountInUSD(null);
      reset("", {
        keepValues: false,
      });
      setIsSubmitted(true);
      setError(false);
      setTimeout(function(){
        router.reload();
     }, 3000);
    } 
    catch (err) {
      setError(err.message);
      console.log(err);
    }
  }
  console.log(isDone)

  return (
    <div>
      <Head>
        <title>Campaign Details</title>
        <meta name="description" content="Create a Withdrawal Request" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      {isSubmitted ? <Confetti width={width} height={height} /> : null}
      <main>
        {" "}
        <Box position={"relative"}>
          {isSubmitted ? (
            <Container
              maxW={"7xl"}
              columns={{ base: 1, md: 2 }}
              spacing={{ base: 10, lg: 32 }}
              py={{ base: 6 }}
            >
              <Alert status="success" mt="2">
                <AlertIcon />
                <AlertDescription mr={2}>
                  {" "}
                  Thank You for your Contribution 🙏
                </AlertDescription>
                <CloseButton
                  position="absolute"
                  right="8px"
                  top="8px"
                  onClick={() => setIsSubmitted(false)}
                />
              </Alert>
            </Container>
          ) : null}
          {campaign.minAmount != undefined ? (
            <Container
              as={SimpleGrid}
              maxW={"7xl"}
              columns={{ base: 1, md: 2 }}
              spacing={{ base: 10, lg: 32 }}
              py={{ base: 6 }}
            >
              <Stack spacing={{ base: 6 }}>
                <Heading
                  lineHeight={1.1}
                  fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
                >
                  {campaign.name}
                </Heading>
                <Text
                  color={useColorModeValue("gray.500", "gray.200")}
                  fontSize={{ base: "lg" }}
                >
                  {campaign.description}
                </Text>
                
                <Box mx={"auto"} w={"full"}>
                  <SimpleGrid columns={{ base: 1 }} spacing={{ base: 5 }}>
                    <StatsCard
                      title={"Minimum Contribution"}
                      stat={`${Web3.utils.fromWei(
                        campaign.minAmount.toString(),
                        "ether"
                      )} ETH ($${getWEIPriceInUSD(
                        ETHPrice,
                        campaign.minAmount
                      )})`}
                      info={
                        "You must contribute at least this much in Wei ( 1 ETH = 10 ^ 18 Wei) to become an approver"
                      }
                    />
                    <StatsCard
                      title={"Wallet Address of Campaign Creator"}
                      stat={campaign.owner}
                      info={
                        "The Campaign Creator created the campaign and can create requests to withdraw money."
                      }
                    />
                    </SimpleGrid>
                </Box>
              </Stack>
              <Stack spacing={{ base: 4 }}>
                <Box>
                  <Stat
                    bg={useColorModeValue("white", "gray.700")}
                    boxShadow={"lg"}
                    rounded={"xl"}
                    p={{ base: 4, sm: 6, md: 8 }}
                    spacing={{ base: 8 }}
                  >
                    <StatLabel fontWeight={"medium"}>
                      <Text as="span" isTruncated mr={2}>
                        {" "}
                        Campaign Balance & Total amount has been donated
                      </Text>
                      <Tooltip
                        label="The balance is how much money this campaign has left to
                    spend and the total amount has been donated is how much money this campaign has been donated."
                        bg={useColorModeValue("white", "gray.700")}
                        placement={"top"}
                        color={useColorModeValue("gray.800", "white")}
                        fontSize={"1em"}
                        px="4"
                      >
                        <InfoIcon
                          color={useColorModeValue("blue.800", "white")}
                        />
                      </Tooltip>
                    </StatLabel>
                    <StatNumber>
                      <Box
                        fontSize={"2xl"}
                        isTruncated
                        maxW={{ base: "	15rem", sm: "sm" }}
                        pt="2"
                      >
                        <Text as="span" fontWeight={"bold"}>
                          {campaign.balance > 0
                            ? "Balance: " + Web3.utils.fromWei(campaign.balance, "ether")
                            : "Balance: 0, Become a Donor 😄"}
                        </Text>
                        <Text
                          as="span"
                          display={campaign.balance > 0 ? "inline" : "none"}
                          pr={2}
                          fontWeight={"bold"}
                        >
                          {" "}
                          ETH
                        </Text>
                        <Text
                          as="span"
                          fontSize="lg"
                          display={campaign.balance > 0 ? "inline" : "none"}
                          fontWeight={"normal"}
                          color={useColorModeValue("gray.500", "gray.200")}
                        >
                          (${getWEIPriceInUSD(ETHPrice, campaign.balance)})
                        </Text>
                        <Text></Text>
                        <Text as="span" fontWeight={"bold"}>
                          Total Amount: {Web3.utils.fromWei(campaign.total, "ether")} ETH {" "}
                        </Text>
                        <Text
                          as="span"
                          fontSize="lg"
                          display={campaign.total > 0 ? "inline" : "none"}
                          fontWeight={"normal"}
                          color={useColorModeValue("gray.500", "gray.200")}
                        >
                          (${getWEIPriceInUSD(ETHPrice, campaign.total)})
                        </Text>
                      </Box>

                      <Text fontSize={"md"} fontWeight="normal">
                        target of {Web3.utils.fromWei(campaign.target, "ether")} ETH ($
                        {getWEIPriceInUSD(ETHPrice, campaign.target)})
                      </Text>
                      <Progress
                        colorScheme="blue"
                        size="sm"
                        value={Web3.utils.fromWei(campaign.total.toString(), "ether")}
                        max={Web3.utils.fromWei(campaign.target.toString(), "ether")}
                        mt={4}
                      />
                    </StatNumber>
                  </Stat>
                </Box>
                <Stack
                  bg={useColorModeValue("white", "gray.700")}
                  boxShadow={"lg"}
                  rounded={"xl"}
                  p={{ base: 4, sm: 6, md: 8 }}
                  spacing={{ base: 6 }}
                >
                  <Heading
                    lineHeight={1.1}
                    fontSize={{ base: "2xl", sm: "3xl" }}
                    color={useColorModeValue("blue.600", "blue.200")}
                  >
                    Contribute Now!
                  </Heading>

                  {isDone ? (
                    <Text fontSize={"sm"}>
                      The Campaign has been done
                    </Text>
                  ) : (
                    <Box mt={10}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <FormControl id="value">
                        <FormLabel>
                          Amount in Ether you want to contribute
                        </FormLabel>
                        <InputGroup>
                          {" "}
                          <Input
                            {...register("value", { required: true })}
                            type="number"
                            isDisabled={formState.isSubmitting}
                            onChange={(e) => {
                              setAmountInUSD(Math.abs(e.target.value));
                            }}
                            step="any"
                            min="0"
                          />{" "}
                          <InputRightAddon children="ETH" />
                        </InputGroup>
                        {amountInUSD ? (
                          <FormHelperText>
                            ~$ {getETHPriceInUSD(ETHPrice, amountInUSD)}
                          </FormHelperText>
                        ) : null}
                      </FormControl>

                      {error ? (
                        <Alert status="error" mt="2">
                          <AlertIcon />
                          <AlertDescription mr={2}> {error}</AlertDescription>
                        </Alert>
                      ) : null}

                      <Stack spacing={10}>
                        {wallet.status === "connected" ? (
                          <Button
                            fontFamily={"heading"}
                            mt={4}
                            w={"full"}
                            bgGradient="linear(to-r, blue.400,green.400)"
                            color={"white"}
                            _hover={{
                              bgGradient: "linear(to-r, blue.400,teal.400)",
                              boxShadow: "xl",
                            }}
                            isLoading={formState.isSubmitting}
                            isDisabled={amountInUSD ? false : true}
                            type="submit"
                          >
                            Contribute
                          </Button>
                        ) : (
                          <Alert status="warning" mt={4}>
                            <AlertIcon />
                            <AlertDescription mr={2}>
                              Please Connect Your Wallet to Contribute
                            </AlertDescription>
                          </Alert>
                        )}
                      </Stack>
                    </form>
                  </Box>
                  )}
                </Stack>

                <Stack
                  bg={useColorModeValue("white", "gray.700")}
                  boxShadow={"lg"}
                  rounded={"xl"}
                  p={{ base: 4, sm: 6, md: 8 }}
                  spacing={4}
                >
                  <NextLink href={`/campaign/${campaignId}/requests`}>
                    <Button
                      fontFamily={"heading"}
                      w={"full"}
                      bgGradient="linear(to-r, blue.400,green.400)"
                      color={"white"}
                      _hover={{
                        bgGradient: "linear(to-r, blue.400,teal.400)",
                        boxShadow: "xl",
                      }}
                    >
                      View Withdrawal Requests
                    </Button>
                  </NextLink>
                  <Text fontSize={"sm"}>
                    * You can see where these funds are being used & if you have
                    contributed you can also approve those Withdrawal Requests :)
                  </Text>
                </Stack>
              </Stack>
            </Container>
          ) : (
            <div>
              Loading...
            </div>
          )} 
        </Box>
      </main>
    </div>
  );
}
