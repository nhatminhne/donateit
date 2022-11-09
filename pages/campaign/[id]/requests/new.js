import Head from "next/head";
import NextLink from "next/link";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useWallet } from "use-wallet";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getETHPrice, getETHPriceInUSD } from "../../../../lib/getETHPrice";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  InputRightAddon,
  InputGroup,
  Alert,
  AlertIcon,
  AlertDescription,
  FormErrorMessage,
  FormHelperText,
  Textarea,
} from "@chakra-ui/react";
import Web3 from "web3";
import { useAsync } from "react-use";
import loadBlockchainData from "../../../../src/factory";

export default function NewRequest() {
  const router = useRouter();
  const campaignId = router.query.id;
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, errors },
  } = useForm({
    mode: "onChange",
  });
  const [error, setError] = useState("");
  const [inUSD, setInUSD] = useState();
  const [ETHPrice, setETHPrice] = useState(0);
  const wallet = useWallet();
  const [charityContract, setCharityContract] = useState([]);
  const [errAmount, setErrAmount] = useState(false);
  const [campaign, setCampaign] = useState([]);
  
  useAsync(async () => {
    try {
      const result = await getETHPrice();
      setETHPrice(result);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    campaignId && getContract()
  }, [campaignId])

  async function getContract() {
    const contractCharity = await loadBlockchainData()
    setCharityContract(contractCharity)

    const tmpCampaign = await contractCharity.methods.campaigns(campaignId).call()
    setCampaign(tmpCampaign)
  }

  async function onSubmit(data) {
    console.log(data);
    try {
      if (Web3.utils.toWei(data.value, "ether") > parseInt(campaign.balance)) {
        setErrAmount(true)
      } else {
        setErrAmount(false)
        setError(false)
        const demo = await charityContract.methods
          .createWithdrawal(
            campaignId,
            Web3.utils.toWei(data.value, "ether"),
            data.description
          )
          .send({
            from: wallet.account
          });
        console.log("demo: ",demo)
        router.push(`/campaign/${campaignId}/requests`);
      }
    } catch (err) {
      setError(err.message);
      console.log(err);
    }
  }

  return (
    <div>
      <Head>
        <title>Create a Withdrawal Request</title>
        <meta name="description" content="Create a Withdrawal Request" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <main>
        <Stack spacing={8} mx={"auto"} maxW={"2xl"} py={12} px={6}>
          <Text fontSize={"lg"} color={"blue.400"} justifyContent="center">
            <ArrowBackIcon mr={2} />
            <NextLink href={`/campaign/${campaignId}/requests`}>
              Back to Requests
            </NextLink>
          </Text>
          <Stack>
            <Heading fontSize={"4xl"}>Create a Withdrawal Request 💸</Heading>
          </Stack>
          {campaign.balance != undefined ? (
            campaign.owner == wallet.account ? (
              <Box
                rounded={"lg"}
                bg={useColorModeValue("white", "gray.700")}
                boxShadow={"lg"}
                p={8}
              >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={4}>
                    <FormControl id="description">
                      <FormLabel>Request Description</FormLabel>
                      <Textarea
                        {...register("description", { required: true })}
                        isDisabled={isSubmitting}
                      />
                    </FormControl>
                    <FormControl id="value">
                      <FormLabel>Amount in Ether</FormLabel>
                      <InputGroup>
                        {" "}
                        <Input
                          type="number"
                          {...register("value", { required: true })}
                          isDisabled={isSubmitting}
                          onChange={(e) => {
                            setInUSD(Math.abs(e.target.value));
                          }}
                          step="any"
                        />{" "}
                        <InputRightAddon children="ETH" />
                      </InputGroup>
                      {inUSD ? (
                        <FormHelperText>
                          ~$ {getETHPriceInUSD(ETHPrice, inUSD)}
                        </FormHelperText>
                      ) : null}
                      <FormHelperText>
                        Withdrawal Amount must be less than Campaign Balance: {Web3.utils.fromWei(campaign.balance, "ether")}
                      </FormHelperText>
                    </FormControl>

          
                    {errors.description || errors.value ? (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertDescription mr={2}>
                          {" "}
                          All Fields are Required
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {error ? (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertDescription mr={2}> {error}</AlertDescription>
                      </Alert>
                    ) : null}
                    {errAmount ? (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertDescription mr={2}>
                          {" "}
                          Withdrawal Amount must be less than Campaign Balance
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <Stack spacing={10}>
                      {wallet.status === "connected" ? (
                        <Button
                          bg={"blue.400"}
                          color={"white"}
                          _hover={{
                            bg: "blue.500",
                          }}
                          isLoading={isSubmitting}
                          type="submit"
                        >
                          Create Withdrawal Request
                        </Button>
                      ) : (
                        <Stack spacing={3}>
                          <Button
                            color={"white"}
                            bg={"blue.400"}
                            _hover={{
                              bg: "blue.300",
                            }}
                            onClick={() => wallet.connect()}
                          >
                            Connect Wallet{" "}
                          </Button>
                          <Alert status="warning">
                            <AlertIcon />
                            <AlertDescription mr={2}>
                              Please Connect Your Wallet First to Create a Campaign
                            </AlertDescription>
                          </Alert>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </form>
              </Box>
            ) : (<Text>You are not the Campaign owner</Text>)
          ) : (<Text>Loading...</Text>)}
        </Stack>
      </main>
    </div>
  );
}
