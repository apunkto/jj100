import Layout from "@/src/components/Layout";
import {Box} from "@mui/system";
import {Button, Typography} from "@mui/material";

export default function Ctp() {
    return (
        <Layout>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" gutterBottom>
                    Welcome to the Disc Golf CTP Competition!
                </Typography>
                <Button variant="contained" color="primary" href="/ctp/1">
                    Go to Hole 1
                </Button>
            </Box>
        </Layout>
    );
}